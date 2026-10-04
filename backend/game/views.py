import logging
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

from game.throttles import LoginRateThrottle, RegisterRateThrottle

logger = logging.getLogger('game.auth')

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
    MarketItem,
    StartupProject,
)
from game.serializers import (
    PropertySerializer,
    SkillSerializer,
    JobSerializer,
    CourseSerializer,
    DilemmaSerializer,
    TransactionSerializer,
    CitizenDetailSerializer,
    UserSerializer,
    RegisterSerializer,
    CharacterCustomizeSerializer,
    MarketItemSerializer,
    StartupProjectSerializer,
)

TIME_SLOTS = [
    'Matin (08:00)',
    'Après-midi (14:00)',
    'Soir (18:00)',
    'Nuit (22:00)',
]

ARCHETYPES = {
    'ambitious_student': {
        'title': 'Étudiant Ambitieux & Citoyen du Campus',
        'money': 200000,
        'savings': 100000,
        'energy': 85,
        'wellbeing': 80,
        'skills': {
            'communication': 30,
            'javascript': 25,
            'git': 20,
            'budget': 20,
            'react': 15,
            'entrepreneuriat': 15,
        },
    },
    'resourceful_self_taught': {
        'title': 'Autodidacte Débrouillard & Maker',
        'money': 280000,
        'savings': 20000,
        'energy': 75,
        'wellbeing': 85,
        'skills': {
            'entrepreneuriat': 35,
            'javascript': 30,
            'git': 25,
            'react': 20,
            'communication': 20,
            'budget': 15,
        },
    },
    'pragmatic_saver': {
        'title': 'Gestionnaire Prévoyant & Économe',
        'money': 180000,
        'savings': 170000,
        'energy': 80,
        'wellbeing': 80,
        'skills': {
            'budget': 35,
            'communication': 25,
            'entrepreneuriat': 20,
            'javascript': 15,
            'git': 15,
            'react': 10,
        },
    },
}

VOCATIONS = {
    'tech': {
        'title': 'Découvrir Youth City & Devenir Développeur',
        'target': 'Visiter le Campus District et valider le module Développeur Web Junior',
        'progress': 10,
    },
    'finance': {
        'title': 'Bâtir son socle d\'épargne & Maîtriser son budget',
        'target': 'Explorer le Finance District et déposer ses premiers intérêts d\'épargne BOA',
        'progress': 10,
    },
    'business': {
        'title': 'Intégrer le Business District & Générer des revenus',
        'target': 'Effectuer un premier quart de travail et sécuriser son loyer',
        'progress': 10,
    },
}

def create_initial_character_for_user(user, name=None):
    """Initialise un profil citoyen complet pour un nouvel utilisateur."""
    prop = Property.objects.filter(key='housing-studio').first() or Property.objects.first()
    char_name = name.strip() if name and name.strip() else user.username
    char = Character.objects.create(
        user=user,
        name=char_name,
        avatar_seed=user.username,
        title="Nouveau Citoyen de Youth City",
        level=1,
        xp=0,
        xp_to_next_level=500,
        energy=80,
        wellbeing=80,
        money=250000,
        savings=50000,
        day=1,
        time_slot=TIME_SLOTS[0],
        current_housing=prop,
        current_objective={
            'title': 'Découvrir Youth City & Choisir une formation',
            'target': 'Visiter le Campus District et s\'inscrire à un cours',
            'progress': 10,
        },
    )
    for skill in Skill.objects.all():
        base_level = 20 if skill.key in ['budget', 'communication'] else 10
        CharacterSkill.objects.create(character=char, skill=skill, level_percent=base_level)
    return char


def get_active_character(request):
    """Retrieves the active citizen avatar (user or default demo citizen)."""
    if request.user and request.user.is_authenticated:
        char = Character.objects.filter(user=request.user).first()
        if not char:
            char = create_initial_character_for_user(request.user)
        return char
    char = Character.objects.filter(user__isnull=True).first() or Character.objects.first()
    if not char:
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
def simulate_interview(request, key):
    """Simulates a job interview with pedagogical criteria analysis and hiring decision (§8, §22)."""
    character = get_active_character(request)
    job = get_object_or_404(Job, key=key)

    # 1. Check prerequisite skills
    char_skills = {cs.skill.key: cs.level_percent for cs in character.skills.select_related('skill')}
    for req in job.requirements or []:
        skill_key = req.get('skillKey')
        req_val = req.get('requiredPercent', 0)
        curr_val = char_skills.get(skill_key, 0)
        if curr_val < req_val:
            return Response({
                'error': f"Compétence insuffisante en {req.get('skillName', skill_key)} ({curr_val}% actuel vs {req_val}% requis). Révise au Campus District !"
            }, status=status.HTTP_400_BAD_REQUEST)

    # 2. Get answer index
    try:
        answer_idx = int(request.data.get('answerIndex'))
    except (ValueError, TypeError):
        return Response({'error': "Index de réponse requis."}, status=status.HTTP_400_BAD_REQUEST)

    sample_answers = job.sample_answers or []
    if answer_idx < 0 or answer_idx >= len(sample_answers):
        return Response({'error': "Réponse invalide."}, status=status.HTTP_400_BAD_REQUEST)

    chosen_answer = sample_answers[answer_idx]
    base_score = int(chosen_answer.get('score', 50))
    feedback = chosen_answer.get('feedback', '')

    # 3. Professional outfit bonus (§11, §22)
    has_suit = 'item-suit' in (character.inventory or [])
    suit_bonus = 5 if has_suit else 0
    final_score = min(100, base_score + suit_bonus)

    # 4. Pedagogical criteria breakdown (§22)
    thematic_score = min(10, max(1, round(final_score / 10)))
    clarity_score = min(10, max(1, round((final_score + (3 if final_score > 60 else -5)) / 10)))
    acquis_score = min(10, max(1, round((final_score + (suit_bonus * 2)) / 10)))

    if final_score >= 80:
        advice = "Excellente prestation ! Ton argumentation technique est solide et ton aisance professionnelle a convaincu le recruteur."
    elif final_score >= 70:
        advice = "Prestation convaincante. Pour viser l'excellence, pense à illustrer ton propos avec un exemple chiffré de projet réalisé."
    elif final_score >= 50:
        advice = "Des bases intéressantes mais ta réponse manque de structure. Revois tes projets pratiques et illustre avec des exemples concrets."
    else:
        advice = "Candidature insuffisamment préparée. Prends le temps de valider des formations au Campus District avant de te représenter."

    hired = final_score >= 70
    level_up = False

    with db_transaction.atomic():
        if hired:
            character.current_job = job
            level_up = add_xp_to_character(character, 100)  # +100 XP per Section 15
            character.save()

    return Response({
        'hired': hired,
        'score': final_score,
        'baseScore': base_score,
        'suitBonus': suit_bonus,
        'thematicScore': thematic_score,
        'clarityScore': clarity_score,
        'acquisScore': acquis_score,
        'advice': advice,
        'feedback': feedback,
        'levelUp': level_up,
        'citizen': CitizenDetailSerializer(character).data,
        'message': (
            f"Félicitations, tu as réussi l'entretien avec une note de {final_score}/100 ! Contrat signé chez {job.company}."
            if hired else
            f"Entretien ajourné avec une note de {final_score}/100. Suis les conseils du mentor pour retenter ta chance !"
        )
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

    if request.user and request.user.is_authenticated:
        character = get_active_character(request)
        room = Property.objects.filter(key='housing-room').first() or Property.objects.first()
        character.title = "Nouveau Citoyen de Youth City" if preset == 'new' else "Citoyen Actif"
        character.level = 1 if preset == 'new' else 5
        character.xp = 0 if preset == 'new' else 1450
        character.xp_to_next_level = 500 if preset == 'new' else 2000
        character.energy = 80 if preset == 'new' else 72
        character.wellbeing = 80 if preset == 'new' else 81
        character.money = 250000 if preset == 'new' else 425000
        character.savings = 50000 if preset == 'new' else 200000
        character.day = 1
        character.time_slot = TIME_SLOTS[0]
        character.current_housing = room
        character.current_job = None
        character.completed_courses = []
        character.completed_projects = 0
        character.completed_challenges = 0
        character.save()

        for cs in character.skills.all():
            cs.level_percent = 15 if preset == 'new' else 50
            cs.save()

        Certification.objects.filter(character=character).delete()
        Transaction.objects.filter(character=character).delete()

        return Response({
            'message': f"Partie réinitialisée en mode '{preset}'.",
            'citizen': CitizenDetailSerializer(character).data,
            'day': character.day,
            'timeSlot': character.time_slot,
            'transactions': [],
        })
    else:
        from django.core.management import call_command
        call_command('seed_game_data')
        character = Character.objects.filter(user__isnull=True).first() or Character.objects.first()
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


# --- AUTHENTICATION & COMPTES (§42, §47) ---

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([RegisterRateThrottle])
def register_user(request):
    """Registers a new user account, creates their citizen character, and returns JWT tokens."""
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    username = serializer.validated_data['username']
    email = serializer.validated_data.get('email', '')
    password = serializer.validated_data['password']
    citizen_name = serializer.validated_data.get('citizenName', '')

    with db_transaction.atomic():
        user = User.objects.create_user(username=username, email=email, password=password)
        character = create_initial_character_for_user(user, name=citizen_name)

    refresh = RefreshToken.for_user(user)
    client_ip = request.META.get('REMOTE_ADDR', 'unknown')
    logger.info("Nouveau compte créé : '%s' (ID %d) depuis IP %s", user.username, user.id, client_ip)

    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
        'citizen': CitizenDetailSerializer(character).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login_user(request):
    """Authenticates user credentials and returns JWT tokens with citizen data."""
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')
    client_ip = request.META.get('REMOTE_ADDR', 'unknown')

    if not username or not password:
        return Response(
            {'error': 'Identifiant et mot de passe requis.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(request, username=username, password=password)
    if not user:
        logger.warning(
            "Échec d'authentification pour le compte '%s' depuis l'IP %s",
            username,
            client_ip
        )
        return Response(
            {'error': 'Nom d\'utilisateur ou mot de passe incorrect.'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    logger.info(
        "Connexion réussie pour le compte '%s' (ID %d) depuis l'IP %s",
        user.username,
        user.id,
        client_ip
    )

    character = Character.objects.filter(user=user).first()
    if not character:
        character = create_initial_character_for_user(user)

    refresh = RefreshToken.for_user(user)

    return Response({
        'user': UserSerializer(user).data,
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
        'citizen': CitizenDetailSerializer(character).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Returns currently authenticated user profile and their citizen stats."""
    character = get_active_character(request)
    return Response({
        'user': UserSerializer(request.user).data,
        'citizen': CitizenDetailSerializer(character).data,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def customize_character(request):
    """Customizes active citizen avatar with chosen archetype, appearance, and initial vocation (§14, §47)."""
    serializer = CharacterCustomizeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    character = get_active_character(request)
    archetype_data = ARCHETYPES.get(data['archetype'], ARCHETYPES['ambitious_student'])
    vocation_data = VOCATIONS.get(data['vocation'], VOCATIONS['tech'])

    with db_transaction.atomic():
        character.name = data['name'].strip()
        character.avatar_seed = data.get('avatarSeed', 'felix').strip()
        character.title = archetype_data['title']
        character.level = 1
        character.xp = 0
        character.xp_to_next_level = 500
        character.money = archetype_data['money']
        character.savings = archetype_data['savings']
        character.energy = archetype_data['energy']
        character.wellbeing = archetype_data['wellbeing']
        character.day = 1
        character.time_slot = TIME_SLOTS[0]
        character.current_objective = vocation_data

        # Configure skills according to archetype
        for skill_key, level in archetype_data['skills'].items():
            skill_obj = Skill.objects.filter(key=skill_key).first()
            if skill_obj:
                char_skill, _ = CharacterSkill.objects.get_or_create(
                    character=character,
                    skill=skill_obj,
                    defaults={'level_percent': level}
                )
                char_skill.level_percent = level
                char_skill.save()

        # Reset transactions & record initial stipend
        Transaction.objects.filter(character=character).delete()
        initial_tx = Transaction.objects.create(
            character=character,
            timestamp="J-1 Matin",
            label=f"Dotation d'accueil ({archetype_data['title']})",
            amount=character.money,
            transaction_type='income',
            category='Bienvenue',
        )
        character.save()

    return Response({
        'message': f"Bienvenue à Youth City, {character.name} ! Ton profil de citoyen est prêt.",
        'citizen': CitizenDetailSerializer(character).data,
        'transactions': TransactionSerializer([initial_tx], many=True).data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def list_market_items(request):
    """Returns the market catalog of nourishment, equipment, and mobility goods (§11, §19)."""
    character = get_active_character(request)
    category = request.query_params.get('category')
    items = MarketItem.objects.all().order_by('price')
    if category:
        items = items.filter(category=category)
    serializer = MarketItemSerializer(items, many=True, context={'character': character})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def buy_market_item(request):
    """Purchases an item: immediate vitality effect or permanent equipment inventory (§11, §19)."""
    item_key = request.data.get('itemKey') or request.data.get('item_key')
    if not item_key:
        return Response({'error': "Clé d'article manquante."}, status=status.HTTP_400_BAD_REQUEST)

    item = MarketItem.objects.filter(key=item_key).first()
    if not item:
        return Response({'error': "Article introuvable au Market District."}, status=status.HTTP_404_NOT_FOUND)

    character = get_active_character(request)

    if not item.is_consumable:
        inventory = list(character.inventory or [])
        if item.key in inventory:
            return Response({'error': "Tu possèdes déjà cet équipement dans ton inventaire."}, status=status.HTTP_400_BAD_REQUEST)

    if character.money < item.price:
        return Response({
            'error': f"Fonds insuffisants. Tu as {character.money:,} MGA mais cet article coûte {item.price:,} MGA."
        }, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        if not item.is_consumable:
            inventory = list(character.inventory or [])
            inventory.append(item.key)
            character.inventory = inventory
            message = f"Équipement acquis : {item.name}. Ajouté à ton inventaire !"
        else:
            message = f"Dégustation terminée : {item.name}. Vitalité restaurée !"

        character.money -= item.price
        if item.energy_bonus > 0:
            character.energy = min(100, character.energy + item.energy_bonus)
        if item.wellbeing_bonus > 0:
            character.wellbeing = min(100, character.wellbeing + item.wellbeing_bonus)

        time_label = character.time_slot.split(' ')[0] if character.time_slot else "Matin"
        tx = Transaction.objects.create(
            character=character,
            timestamp=f"J-{character.day} {time_label}",
            label=f"Achat Market : {item.name}",
            amount=-item.price,
            transaction_type='expense',
            category='Market',
        )
        character.save()

    return Response({
        'message': message,
        'citizen': CitizenDetailSerializer(character).data,
        'transaction': TransactionSerializer(tx).data,
        'item': MarketItemSerializer(item, context={'character': character}).data,
    })


# --- STARTUP DISTRICT (§12, §24) ---

@api_view(['GET'])
@permission_classes([AllowAny])
def list_startup_projects(request):
    """Lists startup ventures of the active citizen (§12, §24)."""
    character = get_active_character(request)
    projects = StartupProject.objects.filter(character=character).order_by('-created_at')

    if not projects.exists() and (not character.user or character.name == "Emmanuel"):
        initial_proj = StartupProject.objects.create(
            character=character,
            key="startup-ecotana",
            name="EcoCollect Tana",
            sector="greentech",
            pitch="Plateforme de collecte géolocalisée et valorisation des déchets recyclables à Antananarivo.",
            stage="idea",
            progress=25,
            treasury=150000,
            monthly_revenue=0,
            reputation=20,
            users_count=0,
            team=["Fondateur & Porteur de Projet"],
        )
        projects = [initial_proj]

    serializer = StartupProjectSerializer(projects, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_startup_project(request):
    """Launches a new entrepreneurial project (§12, §24)."""
    import uuid
    character = get_active_character(request)
    name = (request.data.get('name') or '').strip()
    sector = request.data.get('sector', 'tech')
    pitch = (request.data.get('pitch') or '').strip()

    try:
        capital = int(request.data.get('initialCapital', 30000))
    except (ValueError, TypeError):
        capital = 30000

    if len(name) < 3:
        return Response({'error': "Le nom du projet doit comporter au moins 3 caractères."}, status=status.HTTP_400_BAD_REQUEST)
    if len(pitch) < 10:
        return Response({'error': "Le pitch doit comporter au moins 10 caractères pour convaincre l'incubateur."}, status=status.HTTP_400_BAD_REQUEST)
    if capital < 20000:
        return Response({'error': "Le capital initial minimum est de 20 000 MGA."}, status=status.HTTP_400_BAD_REQUEST)
    if character.money < capital:
        return Response({'error': f"Fonds personnels insuffisants. Tu disposes de {character.money:,} MGA."}, status=status.HTTP_400_BAD_REQUEST)

    slug_key = f"startup-{uuid.uuid4().hex[:8]}"

    with db_transaction.atomic():
        character.money -= capital
        level_up = add_xp_to_character(character, 80)
        character.completed_projects += 1
        character.save()

        tx = Transaction.objects.create(
            character=character,
            timestamp=f"J-{character.day} {character.time_slot.split(' ')[0]}",
            label=f"Apport capital initial : {name}",
            amount=-capital,
            transaction_type='expense',
            category='Startup',
        )

        project = StartupProject.objects.create(
            character=character,
            key=slug_key,
            name=name,
            sector=sector,
            pitch=pitch,
            stage='idea',
            progress=15,
            treasury=capital,
            monthly_revenue=0,
            reputation=15,
            users_count=0,
            team=["Fondateur"],
        )

    return Response({
        'message': f"Félicitations ! La startup '{project.name}' a été enregistrée à l'incubateur du Startup District.",
        'project': StartupProjectSerializer(project).data,
        'citizen': CitizenDetailSerializer(character).data,
        'transaction': TransactionSerializer(tx).data,
        'levelUp': level_up,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def advance_startup_action(request, key):
    """Executes an action in the entrepreneurial pipeline (§12, §24)."""
    character = get_active_character(request)
    project = get_object_or_404(StartupProject, key=key, character=character)
    action_type = request.data.get('actionType')

    if character.energy < 15:
        return Response({'error': "Énergie vitale insuffisante (min. 15%). Repose-toi au Residential District !"}, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        character.energy -= 15
        level_up = False

        if action_type == 'market_study':
            project.progress = min(100, project.progress + 25)
            project.reputation = min(100, project.reputation + 10)
            level_up = add_xp_to_character(character, 50)
            message = "Étude de marché et entretiens prospects validés (+25% progression, +10 réputation)."
            if project.progress >= 70 and project.stage == 'idea':
                project.stage = 'mvp'
                project.progress = 20
                message += " Étape franchie : passage au prototypage MVP !"

        elif action_type == 'develop_mvp':
            if project.treasury < 25000:
                return Response({'error': "Trésorerie de startup insuffisante (25 000 MGA requis pour prototyper)."}, status=status.HTTP_400_BAD_REQUEST)
            project.treasury -= 25000
            project.progress = min(100, project.progress + 30)
            project.reputation = min(100, project.reputation + 15)
            level_up = add_xp_to_character(character, 70)
            message = "Développement du MVP achevé avec succès (+30% progression, +15 réputation)."
            if project.progress >= 70 and project.stage in ['idea', 'mvp']:
                project.stage = 'launched'
                project.progress = 25
                project.users_count += 10
                project.monthly_revenue += 40000
                message += " Étape franchie : lancement officiel et premiers clients acquis !"

        elif action_type == 'launch_campaign':
            if project.treasury < 20000:
                return Response({'error': "Trésorerie de startup insuffisante (20 000 MGA requis pour le marketing)."}, status=status.HTTP_400_BAD_REQUEST)
            project.treasury -= 20000
            new_users = 25
            rev_boost = 60000
            project.users_count += new_users
            project.monthly_revenue += rev_boost
            project.reputation = min(100, project.reputation + 20)
            project.progress = min(100, project.progress + 25)
            level_up = add_xp_to_character(character, 80)
            message = f"Campagne marketing réussie : +{new_users} clients et +{rev_boost:,} MGA de revenus mensuels !"
            if project.progress >= 80 and project.stage == 'launched':
                project.stage = 'growth'
                message += " Étape franchie : phase de croissance & scalabilité atteinte !"

        elif action_type == 'recruit_partner':
            role = request.data.get('role', 'Co-fondateur Tech')
            team = list(project.team or [])
            team.append(role)
            project.team = team
            project.reputation = min(100, project.reputation + 10)
            level_up = add_xp_to_character(character, 40)
            message = f"Nouveau partenaire intégré à l'équipe : {role} (+10 réputation)."

        elif action_type == 'collect_revenue':
            if project.monthly_revenue <= 0:
                return Response({'error': "Aucun revenu récurrent généré pour l'instant. Lance d'abord ton produit !"}, status=status.HTTP_400_BAD_REQUEST)
            dividend = round(project.monthly_revenue * 0.5)
            project.treasury += (project.monthly_revenue - dividend)
            character.money += dividend
            tx = Transaction.objects.create(
                character=character,
                timestamp=f"J-{character.day} {character.time_slot.split(' ')[0]}",
                label=f"Dividendes Startup : {project.name}",
                amount=dividend,
                transaction_type='income',
                category='Startup',
            )
            message = f"Revenus encaissés : +{dividend:,} MGA en dividendes personnels et trésorerie renforcée !"

        else:
            return Response({'error': "Action entrepreneuriale inconnue."}, status=status.HTTP_400_BAD_REQUEST)

        project.save()
        character.save()

    return Response({
        'message': message,
        'project': StartupProjectSerializer(project).data,
        'citizen': CitizenDetailSerializer(character).data,
        'levelUp': level_up,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def claim_incubator_grant(request, key):
    """Grants incubator seed capital if the project proves traction or MVP (§12, §24)."""
    character = get_active_character(request)
    project = get_object_or_404(StartupProject, key=key, character=character)

    if project.has_incubator_grant:
        return Response({'error': "Cette startup a déjà obtenu la subvention d'amorçage."}, status=status.HTTP_400_BAD_REQUEST)

    if project.reputation < 30 and project.stage == 'idea':
        return Response({
            'error': "Dossier insuffisant pour le jury de l'incubateur. Valide ton étude de marché ou obtiens au moins 30% de réputation !"
        }, status=status.HTTP_400_BAD_REQUEST)

    GRANT_AMOUNT = 200000  # 200 000 MGA

    with db_transaction.atomic():
        project.treasury += GRANT_AMOUNT
        project.has_incubator_grant = True
        project.reputation = min(100, project.reputation + 25)
        level_up = add_xp_to_character(character, 100)
        project.save()
        character.save()

    return Response({
        'message': f"🎉 Félicitations ! Le jury de l'incubateur a accordé une bourse d'amorçage de {GRANT_AMOUNT:,} MGA à {project.name} !",
        'project': StartupProjectSerializer(project).data,
        'citizen': CitizenDetailSerializer(character).data,
        'levelUp': level_up,
    })



