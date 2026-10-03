from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction

from game.models import (
    Property,
    Skill,
    Job,
    Course,
    Character,
    CharacterSkill,
    Certification,
    Transaction,
    Dilemma,
)
from game.serializers import (
    PropertySerializer,
    SkillSerializer,
    JobSerializer,
    CourseSerializer,
    DilemmaSerializer,
    TransactionSerializer,
    CitizenDetailSerializer,
)

TIME_SLOTS = [
    'Matin (08:00)',
    'Après-midi (14:00)',
    'Soir (18:00)',
    'Nuit (22:00)',
]

def get_active_character(request):
    """Retrieves the active citizen avatar (user or default demo citizen)."""
    if request.user and request.user.is_authenticated:
        char, _ = Character.objects.get_or_create(user=request.user, defaults={'name': request.user.username})
        return char
    char = Character.objects.first()
    if not char:
        # Fallback creation if seed has not been run
        prop = Property.objects.first()
        char = Character.objects.create(name="Emmanuel", current_housing=prop)
    return char


def add_xp_to_character(character, amount):
    """Calculates XP gain and handles level up logic."""
    character.xp += amount
    level_up = False
    while character.xp >= character.xp_to_next_level:
        character.level += 1
        character.xp -= character.xp_to_next_level
        character.xp_to_next_level = round(character.xp_to_next_level * 1.3)
        level_up = True
    return level_up


@api_view(['GET'])
@permission_classes([AllowAny])
def get_game_state(request):
    """Returns the consolidated state for the frontend (citizen, day, timeSlot, transactions)."""
    character = get_active_character(request)
    citizen_data = CitizenDetailSerializer(character).data
    transactions = Transaction.objects.filter(character=character).order_by('-created_at')[:20]
    active_dilemma = Dilemma.objects.first()

    return Response({
        'citizen': citizen_data,
        'day': character.day,
        'timeSlot': character.time_slot,
        'transactions': TransactionSerializer(transactions, many=True).data,
        'activeDilemma': DilemmaSerializer(active_dilemma).data if active_dilemma else None,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def advance_time(request):
    """Advances time slot or triggers overnight energy recovery when day advances."""
    character = get_active_character(request)
    current_slot = character.time_slot
    
    try:
        curr_idx = TIME_SLOTS.index(current_slot)
    except ValueError:
        curr_idx = 0

    if curr_idx < len(TIME_SLOTS) - 1:
        character.time_slot = TIME_SLOTS[curr_idx + 1]
        msg = f"Le temps s'écoule : {character.time_slot}"
    else:
        # End of day -> overnight rest -> next day
        character.day += 1
        character.time_slot = TIME_SLOTS[0]
        housing = character.current_housing
        recovery = housing.energy_recovery if housing else 50
        character.energy = min(100, character.energy + recovery)
        msg = f"Nouveau jour {character.day} ! +{recovery}% d'énergie récupérée grâce à ton logement."

    character.save()
    return Response({
        'day': character.day,
        'timeSlot': character.time_slot,
        'energy': character.energy,
        'message': msg,
        'citizen': CitizenDetailSerializer(character).data,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def rest_and_sleep(request):
    """Explicit sleep action restoring energy based on housing comfort."""
    character = get_active_character(request)
    housing = character.current_housing
    recovery = housing.energy_recovery if housing else 50
    character.energy = min(100, character.energy + recovery)
    character.save()

    return Response({
        'energy': character.energy,
        'message': f"Nuit de repos : +{recovery}% d'énergie récupérée.",
        'citizen': CitizenDetailSerializer(character).data,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def change_housing(request):
    """Switches the citizen's primary residence."""
    character = get_active_character(request)
    housing_id = request.data.get('housing_id')
    if not housing_id:
        return Response({'error': 'housing_id est requis.'}, status=status.HTTP_400_BAD_REQUEST)

    prop = get_object_or_404(Property, key=housing_id)
    character.current_housing = prop
    character.save()

    return Response({
        'message': f"Tu as emménagé dans : {prop.name}",
        'currentHousingId': prop.key,
        'citizen': CitizenDetailSerializer(character).data,
    })


# --- CAMPUS DISTRICT ---

@api_view(['GET'])
@permission_classes([AllowAny])
def list_courses(request):
    """Lists all available courses in the Campus District."""
    courses = Course.objects.all()
    return Response(CourseSerializer(courses, many=True).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_course(request, key):
    """Validates course module completion, updates skills, awards certification and XP."""
    character = get_active_character(request)
    course = get_object_or_404(Course, key=key)

    with db_transaction.atomic():
        # Update skills
        for skill_key, gain in (course.skills_awarded or {}).items():
            skill_obj = Skill.objects.filter(key=skill_key).first()
            if skill_obj:
                char_skill, _ = CharacterSkill.objects.get_or_create(
                    character=character,
                    skill=skill_obj,
                    defaults={'level_percent': 10}
                )
                char_skill.level_percent = min(100, char_skill.level_percent + gain)
                char_skill.save()

        # Update completed courses
        completed = list(character.completed_courses or [])
        is_first_time = course.key not in completed
        if is_first_time:
            completed.append(course.key)
            character.completed_courses = completed

            # Add certification
            if course.certification_name:
                Certification.objects.get_or_create(
                    character=character,
                    title=course.certification_name
                )

        # Energy consumption
        character.energy = max(10, character.energy - 15)
        
        # XP gain
        level_up = add_xp_to_character(character, course.xp_reward)
        character.save()

    return Response({
        'message': f"Formation validée ! Compétences renforcées et certificat '{course.certification_name}' ajouté.",
        'xpAwarded': course.xp_reward,
        'levelUp': level_up,
        'citizen': CitizenDetailSerializer(character).data,
    })


# --- BUSINESS DISTRICT ---

@api_view(['GET'])
@permission_classes([AllowAny])
def list_jobs(request):
    """Lists available employment offers in the Business District."""
    jobs = Job.objects.all()
    return Response(JobSerializer(jobs, many=True).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def hire_job(request, key):
    """Hires the citizen for the specified job."""
    character = get_active_character(request)
    job = get_object_or_404(Job, key=key)

    character.current_job = job
    level_up = add_xp_to_character(character, 120)
    character.save()

    return Response({
        'message': f"Félicitations, tu es embauché(e) comme {job.title} chez {job.company} !",
        'job': JobSerializer(job).data,
        'levelUp': level_up,
        'citizen': CitizenDetailSerializer(character).data,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def work_shift(request):
    """Executes a work shift, earning daily salary in MGA and consuming energy."""
    character = get_active_character(request)
    if not character.current_job:
        return Response({
            'error': "Aucun emploi actif. Postule d'abord au Business District !"
        }, status=status.HTTP_400_BAD_REQUEST)

    job = character.current_job
    if character.energy < job.energy_per_shift:
        return Response({
            'error': "Énergie insuffisante pour accomplir ce shift. Repose-toi au Residential District !"
        }, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        daily_salary = round(job.salary / 20)
        character.money += daily_salary
        character.energy -= job.energy_per_shift
        level_up = add_xp_to_character(character, 40)
        character.save()

        tx = Transaction.objects.create(
            character=character,
            timestamp=f"J-{character.day} {character.time_slot.split(' ')[0]}",
            label=f"Salaire journalier — {job.title}",
            amount=daily_salary,
            transaction_type='income',
            category='Salaire',
        )

    return Response({
        'message': f"Journée de travail accomplie ! +{daily_salary:,} MGA perçus.",
        'salaryEarned': daily_salary,
        'energySpent': job.energy_per_shift,
        'levelUp': level_up,
        'transaction': TransactionSerializer(tx).data,
        'citizen': CitizenDetailSerializer(character).data,
    })


# --- FINANCE DISTRICT ---

@api_view(['POST'])
@permission_classes([AllowAny])
def deposit_savings(request):
    """Transfers funds from cash to savings in MGA."""
    character = get_active_character(request)
    try:
        amount = int(request.data.get('amount', 0))
    except (ValueError, TypeError):
        return Response({'error': 'Montant invalide.'}, status=status.HTTP_400_BAD_REQUEST)

    if amount <= 0:
        return Response({'error': 'Le montant doit être supérieur à zéro.'}, status=status.HTTP_400_BAD_REQUEST)

    if character.money < amount:
        return Response({
            'error': f"Fonds insuffisants. Solde courant : {character.money:,} MGA."
        }, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        character.money -= amount
        character.savings += amount
        character.save()

        tx = Transaction.objects.create(
            character=character,
            timestamp=f"J-{character.day} {character.time_slot.split(' ')[0]}",
            label="Virement vers livret d'épargne",
            amount=-amount,
            transaction_type='savings_in',
            category='Épargne',
        )

    return Response({
        'message': f"{amount:,} MGA placés avec succès sur ton livret d'épargne.",
        'savings': character.savings,
        'money': character.money,
        'transaction': TransactionSerializer(tx).data,
        'citizen': CitizenDetailSerializer(character).data,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def withdraw_savings(request):
    """Transfers funds from savings to cash in MGA."""
    character = get_active_character(request)
    try:
        amount = int(request.data.get('amount', 0))
    except (ValueError, TypeError):
        return Response({'error': 'Montant invalide.'}, status=status.HTTP_400_BAD_REQUEST)

    if amount <= 0:
        return Response({'error': 'Le montant doit être supérieur à zéro.'}, status=status.HTTP_400_BAD_REQUEST)

    if character.savings < amount:
        return Response({
            'error': f"Épargne insuffisante. Solde épargne : {character.savings:,} MGA."
        }, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        character.savings -= amount
        character.money += amount
        character.save()

        tx = Transaction.objects.create(
            character=character,
            timestamp=f"J-{character.day} {character.time_slot.split(' ')[0]}",
            label="Retrait d'épargne vers compte courant",
            amount=amount,
            transaction_type='savings_out',
            category='Épargne',
        )

    return Response({
        'message': f"{amount:,} MGA transférés sur ton compte courant.",
        'savings': character.savings,
        'money': character.money,
        'transaction': TransactionSerializer(tx).data,
        'citizen': CitizenDetailSerializer(character).data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def list_transactions(request):
    """Retrieves transaction history for the citizen."""
    character = get_active_character(request)
    transactions = Transaction.objects.filter(character=character).order_by('-created_at')[:50]
    return Response(TransactionSerializer(transactions, many=True).data)


# --- RESIDENTIAL DISTRICT ---

@api_view(['GET'])
@permission_classes([AllowAny])
def list_properties(request):
    """Lists housing properties available in the Residential District."""
    properties = Property.objects.all()
    return Response(PropertySerializer(properties, many=True).data)


# --- DILEMMAS & ALÉAS ---

@api_view(['GET'])
@permission_classes([AllowAny])
def get_active_dilemma(request):
    """Fetches an active ethical or financial dilemma."""
    dilemma = Dilemma.objects.first()
    if not dilemma:
        return Response({'dilemma': None})
    return Response(DilemmaSerializer(dilemma).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def resolve_dilemma(request):
    """Applies consequences of choosing a dilemma option."""
    character = get_active_character(request)
    option_id = request.data.get('option_id')
    dilemma_key = request.data.get('dilemma_key', 'dilemma-broken-laptop')

    dilemma = get_object_or_404(Dilemma, key=dilemma_key)
    selected_option = next((opt for opt in dilemma.options if opt.get('id') == option_id), None)
    
    if not selected_option:
        return Response({'error': 'Option invalide.'}, status=status.HTTP_400_BAD_REQUEST)

    cost_money = selected_option.get('costMoney', 0)
    cost_energy = selected_option.get('costEnergy', 0)
    gain_xp = selected_option.get('gainXp', 0)
    impact_skills = selected_option.get('impactSkills', {})
    consequence_text = selected_option.get('consequenceText', '')

    if cost_money > 0 and character.money < cost_money:
        return Response({
            'error': f"Fonds insuffisants ({character.money:,} MGA disponibles pour un coût de {cost_money:,} MGA)."
        }, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        if cost_money > 0:
            character.money -= cost_money
            Transaction.objects.create(
                character=character,
                timestamp=f"J-{character.day} {character.time_slot.split(' ')[0]}",
                label=f"Arbitrage Aléa : {selected_option.get('text')[:60]}",
                amount=-cost_money,
                transaction_type='expense',
                category='Aléas',
            )

        character.energy = max(5, character.energy - cost_energy)
        level_up = add_xp_to_character(character, gain_xp)

        # Apply skill impacts
        for skill_key, delta in impact_skills.items():
            skill_obj = Skill.objects.filter(key=skill_key).first()
            if skill_obj:
                char_skill, _ = CharacterSkill.objects.get_or_create(
                    character=character,
                    skill=skill_obj,
                    defaults={'level_percent': 50}
                )
                char_skill.level_percent = max(0, min(100, char_skill.level_percent + delta))
                char_skill.save()

        character.save()

    return Response({
        'message': consequence_text,
        'levelUp': level_up,
        'citizen': CitizenDetailSerializer(character).data,
    })


# --- RESET ---

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_game(request):
    """Resets game state to demo preset (Emmanuel) or new citizen."""
    preset = request.data.get('preset', 'demo')
    from django.core.management import call_command
    call_command('seed_game_data')

    character = Character.objects.first()
    if preset == 'new':
        character.name = "Nouveau Citoyen"
        character.title = "Citoyen Débutant"
        character.level = 1
        character.xp = 0
        character.xp_to_next_level = 500
        character.energy = 80
        character.wellbeing = 80
        character.money = 250000
        character.savings = 50000
        character.day = 1
        character.time_slot = TIME_SLOTS[0]
        room = Property.objects.filter(key='housing-room').first()
        character.current_housing = room
        character.current_job = None
        character.completed_courses = []
        character.completed_projects = 0
        character.completed_challenges = 0
        character.save()

        # Reset skills
        for cs in character.skills.all():
            cs.level_percent = 15
            cs.save()

        Certification.objects.filter(character=character).delete()
        Transaction.objects.filter(character=character).delete()

    return Response({
        'message': f"Partie réinitialisée en mode '{preset}'.",
        'citizen': CitizenDetailSerializer(character).data,
        'day': character.day,
        'timeSlot': character.time_slot,
        'transactions': TransactionSerializer(Transaction.objects.filter(character=character), many=True).data,
    })
