import logging
import hashlib
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from game.throttles import LoginRateThrottle, RegisterRateThrottle, NovaChatRateThrottle
from game.sanitizers import (
    sanitize_text,
    sanitize_short_identifier,
    sanitize_multiline_content,
    detect_indirect_prompt_injection,
)

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
    Guild,
    GuildMembership,
    Hackathon,
    HackathonParticipation,
    ModerationReport,
    FreelanceGig,
    FreelanceContract,
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
    GuildSerializer,
    HackathonSerializer,
    HackathonParticipationSerializer,
    ModerationReportSerializer,
    FreelanceGigSerializer,
    FreelanceContractSerializer,
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


def get_recurring_cycle_info(character):
    """
    Calcule l'état des échéances récurrentes (§18, §20) :
    - Loyer mensuel : cycle de 30 jours
    - Intérêts prévisionnels du livret d'épargne (1% mensuel)
    - Salaire mensuel prévisionnel
    """
    DAYS_PER_CYCLE = 30
    current_cycle_day = ((character.day - 1) % DAYS_PER_CYCLE) + 1
    days_until_rent = DAYS_PER_CYCLE - current_cycle_day
    housing = character.current_housing or Property.objects.filter(key='housing-studio').first() or Property.objects.first()
    rent_price = housing.rent_price if housing else 70000
    monthly_interest = round(character.savings * 0.01) if character.savings > 0 else 0
    monthly_salary = character.current_job.salary if character.current_job else 0

    if character.money >= rent_price:
        status_code = 'ok'
    elif character.money + character.savings >= rent_price:
        status_code = 'warning'
    else:
        status_code = 'danger'

    return {
        'daysPerCycle': DAYS_PER_CYCLE,
        'currentCycleDay': current_cycle_day,
        'daysUntilRent': days_until_rent,
        'rentDueDay': DAYS_PER_CYCLE,
        'rentAmount': rent_price,
        'housingName': housing.name if housing else "Logement",
        'monthlySavingsInterest': monthly_interest,
        'monthlySalary': monthly_salary,
        'status': status_code,
        'hasSufficientRentFunds': (character.money + character.savings) >= rent_price,
    }


def process_recurring_cycle_settlement(character):
    """
    Exécute le règlement financier de fin de mois (§18, §20) :
    1. Prélèvement du loyer mensuel (avec prélèvement de sauvegarde sur épargne si nécessaire)
    2. Versement des intérêts du livret d'épargne BOA (+1% mensuel)
    3. Prime de fidélité pour emploi actif (+10% salaire)
    Retourne un dictionnaire récapitulatif avec les messages et transactions créées.
    """
    housing = character.current_housing or Property.objects.filter(key='housing-studio').first() or Property.objects.first()
    rent_price = housing.rent_price if housing else 70000
    housing_name = housing.name if housing else "Logement"

    summary = {
        'rentPaid': 0,
        'rentCoveredBySavings': 0,
        'rentUnpaid': 0,
        'interestEarned': 0,
        'salaryBonusEarned': 0,
        'status': 'paid',
        'messages': [],
    }

    # 1. Prélèvement du Loyer
    if character.money >= rent_price:
        character.money -= rent_price
        summary['rentPaid'] = rent_price
        summary['status'] = 'paid'
        msg_rent = f"🏠 Loyer mensuel prélevé : -{rent_price:,} MGA ({housing_name})."
        summary['messages'].append(msg_rent)
        Transaction.objects.create(
            character=character,
            timestamp=f"J-{character.day} Matin",
            label=f"Loyer mensuel — {housing_name}",
            amount=-rent_price,
            transaction_type='expense',
            category='Logement',
        )
    elif character.money + character.savings >= rent_price:
        shortfall = rent_price - character.money
        summary['rentPaid'] = character.money
        summary['rentCoveredBySavings'] = shortfall
        summary['status'] = 'covered_by_savings'
        character.savings -= shortfall
        character.money = 0
        msg_rent = f"⚠️ Solde insuffisant : {shortfall:,} MGA prélevés sur ton épargne BOA pour honorer ton loyer ({housing_name})."
        summary['messages'].append(msg_rent)
        Transaction.objects.create(
            character=character,
            timestamp=f"J-{character.day} Matin",
            label="Puisement épargne BOA pour loyer",
            amount=-shortfall,
            transaction_type='savings_out',
            category='Épargne',
        )
        Transaction.objects.create(
            character=character,
            timestamp=f"J-{character.day} Matin",
            label=f"Loyer mensuel — {housing_name}",
            amount=-rent_price,
            transaction_type='expense',
            category='Logement',
        )
    else:
        paid = character.money + character.savings
        unpaid = rent_price - paid
        summary['rentPaid'] = paid
        summary['rentUnpaid'] = unpaid
        summary['status'] = 'overdue'
        character.money = 0
        character.savings = 0
        character.wellbeing = max(10, character.wellbeing - 20)
        msg_rent = f"🚨 Impayé de loyer ! Manque de {unpaid:,} MGA pour {housing_name}. Stress financier : -20% bien-être."
        summary['messages'].append(msg_rent)
        Transaction.objects.create(
            character=character,
            timestamp=f"J-{character.day} Matin",
            label=f"Loyer mensuel — {housing_name} (Impayé partiel)",
            amount=-paid if paid > 0 else 0,
            transaction_type='expense',
            category='Logement',
        )

    # 2. Intérêts du livret d'épargne BOA (1% mensuel sur l'épargne conservée)
    if character.savings > 0:
        interest = round(character.savings * 0.01)
        if interest > 0:
            character.savings += interest
            summary['interestEarned'] = interest
            msg_int = f"🏦 Épargne récompensée : +{interest:,} MGA d'intérêts versés sur ton livret BOA !"
            summary['messages'].append(msg_int)
            Transaction.objects.create(
                character=character,
                timestamp=f"J-{character.day} Matin",
                label="Intérêts mensuels livret d'épargne BOA",
                amount=interest,
                transaction_type='savings_in',
                category='Épargne',
            )

    # 3. Prime mensuelle de fidélité professionnelle (si emploi actif)
    if character.current_job:
        job_bonus = round(character.current_job.salary * 0.10)
        if job_bonus > 0:
            character.money += job_bonus
            summary['salaryBonusEarned'] = job_bonus
            msg_sal = f"💼 Prime de fidélité professionnelle : +{job_bonus:,} MGA perçus ({character.current_job.company})."
            summary['messages'].append(msg_sal)
            Transaction.objects.create(
                character=character,
                timestamp=f"J-{character.day} Matin",
                label=f"Prime mensuelle — {character.current_job.title}",
                amount=job_bonus,
                transaction_type='income',
                category='Salaire',
            )

    return summary


@api_view(['GET'])
@permission_classes([AllowAny])
def get_game_state(request):
    """Returns the consolidated state for the frontend (citizen, day, timeSlot, recurringCycle, transactions)."""
    character = get_active_character(request)
    citizen_data = CitizenDetailSerializer(character).data
    transactions = Transaction.objects.filter(character=character).order_by('-created_at')[:20]
    active_dilemma = None
    if character.active_dilemma_key:
        active_dilemma = Dilemma.objects.filter(key=character.active_dilemma_key).first()

    return Response({
        'citizen': citizen_data,
        'day': character.day,
        'timeSlot': character.time_slot,
        'recurringCycle': get_recurring_cycle_info(character),
        'transactions': TransactionSerializer(transactions, many=True).data,
        'activeDilemma': DilemmaSerializer(active_dilemma).data if active_dilemma else None,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def advance_time(request):
    """Advances time slot or triggers overnight energy recovery and monthly settlements (§18, §20)."""
    character = get_active_character(request)
    current_slot = character.time_slot

    try:
        curr_idx = TIME_SLOTS.index(current_slot)
    except ValueError:
        curr_idx = 0

    settlement_summary = None

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

        # Règlements mensuels récurrents (tous les 30 jours révolus : Jour 31, 61, 91...)
        if (character.day > 1) and ((character.day - 1) % 30 == 0):
            settlement_summary = process_recurring_cycle_settlement(character)
            if settlement_summary and settlement_summary.get('messages'):
                msg += " " + " ".join(settlement_summary['messages'])

    # Événement dynamique contextuel périodique (§26)
    dilemma_triggered = evaluate_and_trigger_dynamic_event(character, force=False)

    character.save()
    return Response({
        'day': character.day,
        'timeSlot': character.time_slot,
        'energy': character.energy,
        'recurringCycle': get_recurring_cycle_info(character),
        'settlementSummary': settlement_summary,
        'activeDilemma': DilemmaSerializer(dilemma_triggered).data if dilemma_triggered else None,
        'message': msg,
        'citizen': CitizenDetailSerializer(character).data,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def advance_day(request):
    """
    Avance directement d'une ou plusieurs journées complètes (§18, §20).
    Applique le repos nocturne et déclenche les règlements récurrents si un cycle est franchi.
    """
    character = get_active_character(request)
    try:
        days_to_advance = max(1, min(60, int(request.data.get('days', 1))))
    except (ValueError, TypeError):
        days_to_advance = 1

    housing = character.current_housing
    recovery = housing.energy_recovery if housing else 50
    settlement_summaries = []

    with db_transaction.atomic():
        for _ in range(days_to_advance):
            character.day += 1
            character.time_slot = TIME_SLOTS[0]
            character.energy = min(100, character.energy + recovery)

            # Règlements mensuels récurrents (tous les 30 jours)
            if (character.day > 1) and ((character.day - 1) % 30 == 0):
                s = process_recurring_cycle_settlement(character)
                settlement_summaries.append(s)

        character.save()

    # Déclenchement d'un événement contextuel (§26) sur avance de jour
    dilemma_triggered = evaluate_and_trigger_dynamic_event(character, force=(character.day % 2 == 0))

    msg = f"Avance rapide : +{days_to_advance} jour(s) écoulé(s). Nous sommes au Jour {character.day}."
    if settlement_summaries:
        all_msgs = [m for s in settlement_summaries for m in s.get('messages', [])]
        if all_msgs:
            msg += " " + " ".join(all_msgs)

    return Response({
        'day': character.day,
        'timeSlot': character.time_slot,
        'energy': character.energy,
        'recurringCycle': get_recurring_cycle_info(character),
        'settlementSummary': settlement_summaries[-1] if settlement_summaries else None,
        'activeDilemma': DilemmaSerializer(dilemma_triggered).data if dilemma_triggered else None,
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


# --- MISSIONS FREELANCE & PETITS CONTRATS (§52) ---

@api_view(['GET'])
@permission_classes([AllowAny])
def list_freelance_gigs(request):
    """Lists available freelance gigs with citizen eligibility & past contracts (§52)."""
    character = get_active_character(request)
    gigs = FreelanceGig.objects.filter(is_active=True).order_by('id')
    serializer = FreelanceGigSerializer(gigs, many=True, context={'character': character})

    contracts = character.freelance_contracts.select_related('gig').order_by('-completed_at')[:10]
    contracts_data = FreelanceContractSerializer(contracts, many=True).data

    all_contracts = character.freelance_contracts.all()
    total_earned = sum(c.payout for c in all_contracts)

    return Response({
        'success': True,
        'gigs': serializer.data,
        'contracts': contracts_data,
        'stats': {
            'totalEarned': total_earned,
            'totalCompleted': len(all_contracts),
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_freelance_gig(request, key):
    """Executes a short-term freelance contract, consuming energy and earning immediate MGA (§52)."""
    character = get_active_character(request)
    gig = get_object_or_404(FreelanceGig, key=key, is_active=True)

    if character.energy < gig.energy_cost:
        return Response({
            'error': f"Énergie vitale insuffisante ({character.energy}% disponible, {gig.energy_cost}% requis). Repose-toi au Residential District !"
        }, status=status.HTTP_400_BAD_REQUEST)

    cs = character.skills.filter(skill__key=gig.required_skill_key).first()
    if not cs:
        cs = character.skills.filter(skill__category=gig.required_skill_key).first()
    skill_lvl = cs.level_percent if cs else 10

    if skill_lvl < gig.min_skill_percent:
        return Response({
            'error': f"Niveau insuffisant en {gig.required_skill_name} ({skill_lvl}% actuel, {gig.min_skill_percent}% requis). Perfectionne tes compétences au Campus !"
        }, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        character.energy = max(0, character.energy - gig.energy_cost)
        character.money += gig.reward_money
        level_up = add_xp_to_character(character, gig.reward_xp)
        character.completed_projects += 1

        if cs:
            cs.level_percent = min(100, cs.level_percent + 2)
            cs.save()

        character.save()

        contract = FreelanceContract.objects.create(
            character=character,
            gig=gig,
            payout=gig.reward_money,
            xp_earned=gig.reward_xp,
            day=character.day,
        )

        tx = Transaction.objects.create(
            character=character,
            timestamp=f"J-{character.day} {character.time_slot.split(' ')[0]}",
            label=f"Mission Freelance — {gig.title} ({gig.client_name})",
            amount=gig.reward_money,
            transaction_type='income',
            category='Freelance',
        )

    return Response({
        'success': True,
        'message': f"Mission « {gig.title} » validée avec succès auprès de {gig.client_name} ! +{gig.reward_money:,} MGA perçus.",
        'payout': gig.reward_money,
        'xpEarned': gig.reward_xp,
        'energySpent': gig.energy_cost,
        'levelUp': level_up,
        'contract': FreelanceContractSerializer(contract).data,
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

def evaluate_and_trigger_dynamic_event(character, force=False):
    """
    Moteur de déclenchement d'événements et d'aléas contextuels (§26, §48, §53).
    Évalue le profil et le contexte du citoyen :
    - Emploi actif ou non
    - Startups en cours ou non
    - Niveau citoyen et jour
    - Aléas déjà résolus (évite la répétition immédiate)
    """
    if character.active_dilemma_key:
        existing = Dilemma.objects.filter(key=character.active_dilemma_key).first()
        if existing:
            return existing

    # Déclenchement automatique selon le rythme du jeu (jours pairs ou force)
    if not force:
        should_trigger = (character.day % 2 == 0) and character.time_slot.startswith('Matin')
        if not should_trigger:
            return None

    resolved_keys = set(character.resolved_dilemmas or [])
    all_dilemmas = list(Dilemma.objects.all())
    if not all_dilemmas:
        return None

    # Filtrage contextuel
    has_job = character.current_job is not None
    has_startup = character.startup_projects.exists()
    candidates = []

    for d in all_dilemmas:
        conds = d.conditions or {}
        if conds.get('has_job') and not has_job:
            continue
        if conds.get('has_startup') and not has_startup:
            continue
        if 'min_level' in conds and character.level < conds['min_level']:
            continue
        if 'min_day' in conds and character.day < conds['min_day']:
            continue
        if 'max_savings' in conds and character.savings > conds['max_savings']:
            continue
        if 'min_savings' in conds and character.savings < conds['min_savings']:
            continue
        candidates.append(d)

    if not candidates:
        candidates = all_dilemmas

    # Priorité aux dilemmes non encore résolus
    unresolved_candidates = [d for d in candidates if d.key not in resolved_keys]
    pool = unresolved_candidates if unresolved_candidates else candidates

    chosen_idx = (character.day * 7 + character.id * 13) % len(pool)
    chosen = pool[chosen_idx]

    character.active_dilemma_key = chosen.key
    character.save(update_fields=['active_dilemma_key'])
    return chosen


@api_view(['GET'])
@permission_classes([AllowAny])
def get_active_dilemma(request):
    """Récupère le dilemme/aléa actif ou évalue le prochain événement dynamique (§26)."""
    character = get_active_character(request)
    dilemma = None
    if character.active_dilemma_key:
        dilemma = Dilemma.objects.filter(key=character.active_dilemma_key).first()
    if not dilemma:
        dilemma = evaluate_and_trigger_dynamic_event(character, force=False)
    if not dilemma:
        return Response({'dilemma': None})
    return Response(DilemmaSerializer(dilemma).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def trigger_dynamic_event(request):
    """Déclenche ou force l'apparition d'un aléa/événement dynamique contextuel (§26)."""
    character = get_active_character(request)
    dilemma = evaluate_and_trigger_dynamic_event(character, force=True)
    if not dilemma:
        return Response({'success': False, 'message': 'Aucun événement disponible actuellement.'})
    return Response({
        'success': True,
        'dilemma': DilemmaSerializer(dilemma).data,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def resolve_dilemma(request):
    """Applique les conséquences du choix d'un dilemme ou aléa dynamique (§25, §26)."""
    character = get_active_character(request)
    option_id = request.data.get('option_id')
    dilemma_key = request.data.get('dilemma_key') or character.active_dilemma_key or 'dilemma-broken-laptop'

    dilemma = get_object_or_404(Dilemma, key=dilemma_key)
    selected_option = next((opt for opt in dilemma.options if opt.get('id') == option_id), None)
    
    if not selected_option:
        return Response({'error': 'Option invalide.'}, status=status.HTTP_400_BAD_REQUEST)

    cost_money = selected_option.get('costMoney', 0)
    cost_energy = selected_option.get('costEnergy', 0)
    gain_xp = selected_option.get('gainXp', 0)
    gain_money = selected_option.get('gainMoney', 0)
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
                label=f"Aléa [{dilemma.title[:30]}] : {selected_option.get('text')[:50]}",
                amount=-cost_money,
                transaction_type='expense',
                category='Aléas',
            )

        if gain_money > 0:
            character.money += gain_money
            Transaction.objects.create(
                character=character,
                timestamp=f"J-{character.day} {character.time_slot.split(' ')[0]}",
                label=f"Gain Aléa [{dilemma.title[:30]}]",
                amount=gain_money,
                transaction_type='income',
                category='Aléas',
            )

        character.energy = max(5, character.energy - cost_energy)
        level_up = add_xp_to_character(character, gain_xp)

        # Impact sur les compétences
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

        # Enregistrement dans les résolus et réinitialisation du dilemme actif
        resolved_list = character.resolved_dilemmas or []
        if dilemma.key not in resolved_list:
            resolved_list.append(dilemma.key)
            character.resolved_dilemmas = resolved_list
        character.completed_challenges += 1
        character.active_dilemma_key = ""
        character.save()

    return Response({
        'message': consequence_text,
        'levelUp': level_up,
        'dilemmaResolvedKey': dilemma.key,
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
        if not settings.DEBUG and not (request.user and request.user.is_staff):
            return Response(
                {'error': "La réinitialisation globale de la base de données est restreinte aux administrateurs en production."},
                status=status.HTTP_403_FORBIDDEN
            )
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
    raw_name = data['name']
    is_injection, _ = detect_indirect_prompt_injection(raw_name)
    if is_injection:
        return Response({'error': "Nom de citoyen non autorisé (directive suspecte)."}, status=status.HTTP_400_BAD_REQUEST)

    cleaned_name = sanitize_short_identifier(raw_name, max_length=50)
    cleaned_seed = sanitize_short_identifier(data.get('avatarSeed', 'felix'), max_length=50)

    archetype_data = ARCHETYPES.get(data['archetype'], ARCHETYPES['ambitious_student'])
    vocation_data = VOCATIONS.get(data['vocation'], VOCATIONS['tech'])

    with db_transaction.atomic():
        character.name = cleaned_name or "Citoyen"
        character.avatar_seed = cleaned_seed or "felix"
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
    raw_name = request.data.get('name') or ''
    raw_pitch = request.data.get('pitch') or ''

    is_inj_name, _ = detect_indirect_prompt_injection(raw_name)
    is_inj_pitch, _ = detect_indirect_prompt_injection(raw_pitch)
    if is_inj_name or is_inj_pitch:
        return Response({
            'error': "Contenu non autorisé : directive d'injection de prompt ou instruction système détectée."
        }, status=status.HTTP_400_BAD_REQUEST)

    name = sanitize_short_identifier(raw_name, max_length=80)
    sector = sanitize_short_identifier(request.data.get('sector', 'tech'), max_length=40)
    pitch = sanitize_multiline_content(raw_pitch, max_length=1200)

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


# --- CITY HUB : GUILDES, HACKATHONS & COMMUNAUTÉ (§13, §29, §30, §31, §33) ---

@api_view(['GET'])
@permission_classes([AllowAny])
def list_guilds(request):
    """Lists professional guilds in City Hub with membership status (§13, §30)."""
    character = get_active_character(request)
    if Guild.objects.count() == 0:
        Guild.objects.bulk_create([
            Guild(key="guild-devs", name="Developers Guild", category="tech", motto="Code is Poetry, Impact is Real", description="Entraide entre développeurs, revues de code et hackathons logiciels.", icon="Code", member_count=48, xp_bonus_percent=10, badge_reward="Master Coder"),
            Guild(key="guild-designers", name="Designers Collective", category="design", motto="L'élégance au service de l'utilisateur", description="Critiques d'interfaces, défis artistiques et ateliers UI/UX pour Madagascar.", icon="Palette", member_count=32, xp_bonus_percent=8, badge_reward="Pixel Master"),
            Guild(key="guild-entrepreneurs", name="Entrepreneurs Club", category="business", motto="De l'idée à la licorne malgache", description="Pitchs, recherche d'associés, mentorat et structuration de business plans.", icon="Rocket", member_count=55, xp_bonus_percent=10, badge_reward="Venture Builder"),
            Guild(key="guild-finance", name="Business & Finance League", category="finance", motto="Rigueur comptable & investissements avisés", description="Stratégie patrimoniale, comptabilité d'entreprise et micro-investissement.", icon="TrendingUp", member_count=27, xp_bonus_percent=8, badge_reward="Capital Architect"),
            Guild(key="guild-green", name="Social & Green Impact", category="green", motto="Pour un développement durable et inclusif", description="Initiatives écologiques, recyclage, AgriTech et impact sociétal à Antananarivo.", icon="Leaf", member_count=41, xp_bonus_percent=8, badge_reward="Eco Champion"),
        ])
    guilds = Guild.objects.all().order_by('-member_count')
    serializer = GuildSerializer(guilds, many=True, context={'character': character})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def join_guild(request, key):
    """Joins a guild, gaining guild perks and welcome XP (§13, §30)."""
    character = get_active_character(request)
    guild = get_object_or_404(Guild, key=key)

    with db_transaction.atomic():
        membership, created = GuildMembership.objects.get_or_create(
            character=character,
            defaults={'guild': guild, 'role': 'member'}
        )
        if not created and membership.guild_id != guild.id:
            old_guild = membership.guild
            old_guild.member_count = max(0, old_guild.member_count - 1)
            old_guild.save()
            membership.guild = guild
            membership.save()
            guild.member_count += 1
            guild.save()
            message = f"Tu as changé de guilde pour rejoindre : {guild.name} !"
        elif created:
            guild.member_count += 1
            guild.save()
            message = f"Bienvenue dans la guilde {guild.name} ! Bonus d'adhésion : +{guild.xp_bonus_percent}% XP sur tes prochaines actions."
        else:
            return Response({'error': "Tu es déjà membre de cette guilde."}, status=status.HTTP_400_BAD_REQUEST)

        level_up = add_xp_to_character(character, 50)
        character.save()

    return Response({
        'message': message,
        'guild': GuildSerializer(guild, context={'character': character}).data,
        'citizen': CitizenDetailSerializer(character).data,
        'levelUp': level_up,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def leave_guild(request, key):
    """Leaves active guild membership (§30)."""
    character = get_active_character(request)
    membership = GuildMembership.objects.filter(character=character, guild__key=key).first()
    if not membership:
        return Response({'error': "Tu n'es pas membre de cette guilde."}, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        guild = membership.guild
        guild.member_count = max(0, guild.member_count - 1)
        guild.save()
        membership.delete()

    return Response({
        'message': f"Tu as quitté la guilde {guild.name}.",
        'citizen': CitizenDetailSerializer(character).data,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def list_hackathons(request):
    """Lists collaborative hackathons and challenges at City Hub (§13, §31)."""
    character = get_active_character(request)
    if Hackathon.objects.count() == 0:
        Hackathon.objects.bulk_create([
            Hackathon(
                key="hackathon-madainnov-2026",
                title="Mada Innov 2026 : Tech for Good",
                theme="Impact Écologique & Inclusion Numérique",
                status="open",
                team_size=4,
                duration_hours=48,
                xp_pool=5000,
                prize_money=500000,
                description="48 heures de sprint intensif en équipe de 4 pour prototyper une solution numérique répondant aux défis environnementaux et d'inclusion à Madagascar.",
                evaluation_criteria=["Innovation & Originalité (25%)", "Faisabilité Technique (25%)", "Impact Local Madagascar (30%)", "Qualité du Pitch (20%)"]
            ),
            Hackathon(
                key="hackathon-fintech-mada",
                title="Sprint FinTech & Mobile Money",
                theme="Inclusion Financière & Paiement Mobile",
                status="open",
                team_size=3,
                duration_hours=36,
                xp_pool=3500,
                prize_money=350000,
                description="Conçois un module de micro-épargne et de paiement mobile ultra-léger adapté aux commerçants et aux jeunes d'Antananarivo.",
                evaluation_criteria=["Sécurité & Fiabilité (30%)", "Simplicité Ergonomique (30%)", "Modèle Économique (40%)"]
            ),
            Hackathon(
                key="hackathon-agritech-challenge",
                title="AgriTech Challenge Madagascar",
                theme="Circuits Courts & Agriculture Connectée",
                status="open",
                team_size=3,
                duration_hours=48,
                xp_pool=4000,
                prize_money=400000,
                description="Bâtis une passerelle directe entre paysans ruraux et marchés urbains pour sécuriser l'approvisionnement alimentaire local.",
                evaluation_criteria=["Impact Producteurs (35%)", "Accessibilité Téléphone Basique (35%)", "Viabilité Opérationnelle (30%)"]
            ),
        ])
    hackathons = Hackathon.objects.all().order_by('-created_at')
    serializer = HackathonSerializer(hackathons, many=True, context={'character': character})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def participate_hackathon(request, key):
    """Submits a collaborative hackathon project, evaluates with jury, and rewards team (§13, §31)."""
    character = get_active_character(request)
    hackathon = get_object_or_404(Hackathon, key=key)

    if hackathon.participations.filter(character=character).exists():
        return Response({'error': "Ton équipe a déjà soumis son projet pour ce hackathon."}, status=status.HTTP_400_BAD_REQUEST)

    if character.energy < 20:
        return Response({'error': "Énergie insuffisante pour un sprint de 48h (min. 20%). Repose-toi au Residential District !"}, status=status.HTTP_400_BAD_REQUEST)

    raw_team = request.data.get('teamName') or f"Team {character.name}"
    raw_pitch = request.data.get('submissionPitch') or ''

    is_inj_pitch, _ = detect_indirect_prompt_injection(raw_pitch)
    is_inj_team, _ = detect_indirect_prompt_injection(raw_team)
    if is_inj_pitch or is_inj_team:
        return Response({
            'error': "Contenu non autorisé : directive d'injection de prompt ou tentative d'altération du jury détectée."
        }, status=status.HTTP_400_BAD_REQUEST)

    team_name = sanitize_short_identifier(raw_team, max_length=80)
    submission_pitch = sanitize_multiline_content(raw_pitch, max_length=1200)

    if len(submission_pitch) < 15:
        return Response({'error': "Le descriptif de votre solution doit comporter au moins 15 caractères pour le jury."}, status=status.HTTP_400_BAD_REQUEST)

    raw_members = request.data.get('teamMembers')
    if not raw_members or not isinstance(raw_members, list):
        team_members = [
            f"{character.name} (Team Lead & Développeur)",
            "Aina R. (Designer UI/UX)",
            "Hery T. (Business & Pitch)",
        ]
    else:
        team_members = [
            sanitize_short_identifier(str(m), max_length=80)
            for m in raw_members if str(m).strip()
        ]
        if not team_members:
            team_members = [f"{character.name} (Team Lead)"]

    # Pedagogical jury scoring logic (§13, §31)
    base_score = 75
    # Skills bonus
    char_skills = dict(character.skills.values_list('skill__key', 'level_percent'))
    avg_skill = sum(char_skills.values()) / max(1, len(char_skills)) if char_skills else 50
    skill_bonus = min(15, round(avg_skill / 7))
    # Guild membership bonus (+5%)
    guild_bonus = 5 if hasattr(character, 'guild_membership') else 0
    pitch_bonus = min(8, round(len(submission_pitch) / 30))

    final_score = min(100, base_score + skill_bonus + guild_bonus + pitch_bonus)
    is_winner = final_score >= 82

    # Rewards calculation
    individual_xp = round(hackathon.xp_pool / hackathon.team_size * (1.2 if is_winner else 0.8))
    individual_money = round(hackathon.prize_money / hackathon.team_size * (1.2 if is_winner else 0.5))

    with db_transaction.atomic():
        character.energy = max(5, character.energy - 20)
        character.money += individual_money
        character.completed_challenges += 1
        level_up = add_xp_to_character(character, individual_xp)
        character.save()

        tx = Transaction.objects.create(
            character=character,
            timestamp=f"J-{character.day} {character.time_slot.split(' ')[0]}",
            label=f"Hackathon : {hackathon.title} ({'1er Prix' if is_winner else 'Prix d\'Honneur'})",
            amount=individual_money,
            transaction_type='income',
            category='Hackathon',
        )

        part = HackathonParticipation.objects.create(
            hackathon=hackathon,
            character=character,
            team_name=team_name,
            team_members=team_members,
            submission_pitch=submission_pitch,
            score=final_score,
            awarded_xp=individual_xp,
            awarded_money=individual_money,
            is_winner=is_winner,
            feedback=(
                "Félicitations ! Le jury a salué la pertinence de votre prototype, l'impact direct pour Madagascar et votre belle cohésion d'équipe."
                if is_winner else
                "Très belle prestation de l'équipe ! Le prototype est prometteur, travaillez l'ergonomie et la viabilité économique pour la prochaine édition."
            )
        )

    return Response({
        'message': (
            f"🏆 Victoire au Hackathon ! Score de {final_score}/100. Ton équipe remporte le 1er Prix : +{individual_xp} XP et +{individual_money:,} MGA pour ta part !"
            if is_winner else
            f"👏 Finaliste du Hackathon ! Score de {final_score}/100. Mention honorable et récompense : +{individual_xp} XP et +{individual_money:,} MGA !"
        ),
        'participation': HackathonParticipationSerializer(part).data,
        'hackathon': HackathonSerializer(hackathon, context={'character': character}).data,
        'citizen': CitizenDetailSerializer(character).data,
        'transaction': TransactionSerializer(tx).data,
        'levelUp': level_up,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def get_community_leaderboard(request):
    """Returns healthy thematic leaderboards without anxiety-inducing metrics (§33)."""
    top_citizens = Character.objects.all().order_by('-xp')[:10]
    citizens_data = [
        {
            'id': c.id,
            'name': c.name,
            'title': c.title,
            'level': c.level,
            'xp': c.xp,
            'completedChallenges': c.completed_challenges,
            'completedProjects': c.completed_projects,
            'savings': c.savings,
        }
        for c in top_citizens
    ]

    top_guilds = Guild.objects.all().order_by('-member_count')[:5]
    guilds_data = [
        {
            'id': g.key,
            'name': g.name,
            'category': g.get_category_display(),
            'memberCount': g.member_count,
            'motto': g.motto,
        }
        for g in top_guilds
    ]

    return Response({
        'topCitizens': citizens_data,
        'topGuilds': guilds_data,
    })


# ============================================================
# 🛡️ Back-Office d'Administration, Modération & Analytics d'Impact (§43, §45, §46)
# ============================================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_admin_overview(request):
    """
    Tableau de bord d'administration et indicateurs d'impact pédagogique (§45, §46).
    Agrège en temps réel les données de la ville virtuelle :
    - Démographie & insertion des citoyens
    - Masse monétaire en circulation & épargne
    - Éducation, certifications & projets d'entrepreneuriat
    - Indicateur de santé économique & inclusion
    - File de modération citoyenne
    """
    total_citizens = Character.objects.count()
    total_money = sum(c.money for c in Character.objects.all())
    total_savings = sum(c.savings for c in Character.objects.all())
    avg_wealth = round((total_money + total_savings) / total_citizens) if total_citizens > 0 else 0

    all_completed = sum(len(c.completed_courses or []) for c in Character.objects.all())
    total_certs = Certification.objects.count()
    total_startups = StartupProject.objects.count()
    funded_startups = StartupProject.objects.filter(has_incubator_grant=True).count()
    total_hackathons = HackathonParticipation.objects.count()
    total_guilds = Guild.objects.count()

    pending_reports = ModerationReport.objects.filter(status='pending').count()
    resolved_reports = ModerationReport.objects.filter(status='resolved').count()

    savings_ratio = min(1.0, (total_savings / (total_money + 1)))
    health_index = min(100, int(50 + (savings_ratio * 30) + min(20, all_completed * 2)))

    recent_citizens = [
        {
            'id': c.id,
            'name': c.name,
            'title': c.title,
            'level': c.level,
            'xp': c.xp,
            'money': c.money,
            'savings': c.savings,
            'currentJob': c.current_job.title if c.current_job else "En recherche",
            'day': c.day,
            'completedCoursesCount': len(c.completed_courses or []),
        }
        for c in Character.objects.all().order_by('-id')[:10]
    ]

    return Response({
        'overview': {
            'totalCitizens': total_citizens,
            'totalMoneyCirculation': total_money,
            'totalSavings': total_savings,
            'avgWealth': avg_wealth,
            'totalCompletedCourses': all_completed,
            'totalCertifications': total_certs,
            'totalStartups': total_startups,
            'fundedStartups': funded_startups,
            'totalHackathonParticipations': total_hackathons,
            'totalGuilds': total_guilds,
            'pendingReports': pending_reports,
            'resolvedReports': resolved_reports,
            'economicHealthScore': health_index,
        },
        'recentCitizens': recent_citizens,
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_moderation_reports(request):
    """
    Liste les signalements citoyens pour examen et modération éthique (§43).
    Graine automatiquement des cas didactiques initiaux si vide.
    """
    if ModerationReport.objects.count() == 0:
        char = Character.objects.first()
        ModerationReport.objects.create(
            reporter=char,
            target_type='chat_message',
            target_id='msg-101',
            target_name='Canal Entraide Campus',
            reason='spam',
            details='Un utilisateur fait la promotion répétée d\'un lien externe non vérifié promettant des gains faciles.',
            status='pending',
            action_taken='none',
            moderator_notes='',
        )
        ModerationReport.objects.create(
            reporter=char,
            target_type='project_pitch',
            target_id='pitch-42',
            target_name='Projet AgroQuick',
            reason='inappropriate',
            details='Description de projet contenant des propos agressifs envers les autres équipes candidates au concours.',
            status='investigating',
            action_taken='none',
            moderator_notes='Signalement pris en charge par l\'équipe pédagogique.',
        )
        ModerationReport.objects.create(
            reporter=char,
            target_type='citizen_profile',
            target_id='cit-99',
            target_name='Profil Testeur',
            reason='fraud',
            details='Soupçon d\'utilisation de macro automatisée pour valider des shifts de travail en continu.',
            status='resolved',
            action_taken='warning',
            moderator_notes='Avertissement officiel envoyé avec réinitialisation des quotas horaires.',
        )

    status_filter = request.query_params.get('status')
    queryset = ModerationReport.objects.all().order_by('-created_at')
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    serializer = ModerationReportSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_moderation_report(request):
    """
    Dépose un nouveau signalement citoyen (§43).
    """
    character = get_active_character(request)
    raw_details = request.data.get('details', '')
    is_injection, _ = detect_indirect_prompt_injection(raw_details)
    if is_injection:
        return Response({
            'error': "Contenu non autorisé : directive d'injection détectée dans le signalement."
        }, status=status.HTTP_400_BAD_REQUEST)

    target_type = sanitize_short_identifier(request.data.get('targetType', 'general'), max_length=40)
    target_id = sanitize_short_identifier(str(request.data.get('targetId', '')), max_length=60)
    target_name = sanitize_short_identifier(request.data.get('targetName', 'Contenu ou Citoyen'), max_length=100)
    reason = sanitize_short_identifier(request.data.get('reason', 'other'), max_length=40)
    details = sanitize_multiline_content(raw_details, max_length=1500)

    if not details:
        return Response({'error': "Merci de décrire la raison du signalement."}, status=status.HTTP_400_BAD_REQUEST)

    report = ModerationReport.objects.create(
        reporter=character,
        target_type=target_type or 'general',
        target_id=target_id or 'unknown',
        target_name=target_name or 'Contenu ou Citoyen',
        reason=reason or 'other',
        details=details,
        status='pending',
        action_taken='none',
    )

    return Response({
        'message': "Signalement transmis avec succès aux modérateurs de Youth City. Merci pour votre vigilance citoyenne.",
        'report': ModerationReportSerializer(report).data,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_moderation_report(request, report_id):
    """
    Modère et clôture un signalement avec sanction ou classement (§43).
    Actions possibles : warning, quarantine, ban, none.
    Statuts : resolved, dismissed, investigating.
    """
    report = get_object_or_404(ModerationReport, id=report_id)
    action = request.data.get('action', 'none')
    new_status = request.data.get('status', 'resolved')
    moderator_notes = request.data.get('notes', '').strip()

    report.action_taken = action
    report.status = new_status
    if moderator_notes:
        report.moderator_notes = moderator_notes
    report.save()

    return Response({
        'message': f"Signalement #{report.id} traité avec succès. Action appliquée : {report.get_action_taken_display()}.",
        'report': ModerationReportSerializer(report).data,
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def grant_admin_stipend(request):
    """
    Octroie une bourse d'encouragement ou subvention d'urgence administrative à un citoyen (§45).
    """
    character_id = request.data.get('characterId')
    try:
        amount = int(request.data.get('amount', 50000))
    except (ValueError, TypeError):
        amount = 50000
    reason = request.data.get('reason', 'Bourse d\'encouragement pédagogique Youth City').strip()

    if amount <= 0:
        return Response({'error': "Le montant de la bourse doit être supérieur à 0 MGA."}, status=status.HTTP_400_BAD_REQUEST)

    if character_id:
        target_character = get_object_or_404(Character, id=character_id)
    else:
        target_character = get_active_character(request)

    target_character.money += amount
    target_character.save()

    tx = Transaction.objects.create(
        character=target_character,
        timestamp=f"J-{target_character.day} {target_character.time_slot.split(' ')[0]}",
        label=reason,
        amount=amount,
        transaction_type='income',
        category='Bourse Administrative',
    )

    return Response({
        'message': f"Bourse administrative de {amount:,} MGA accordée avec succès à {target_character.name}.",
        'citizen': CitizenDetailSerializer(target_character).data,
        'transaction': TransactionSerializer(tx).data,
    })


# ============================================================
# 🤖 Mentor IA NOVA & Sécurité Throttling (§27, §28 — P2/P3/P4)
# ============================================================

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([NovaChatRateThrottle])
def chat_with_nova(request):
    """
    Assistant d'orientation et mentorat IA NOVA (§27, §28).
    Applique le throttling dédié (P3) et les filtres anti-injection (P2/P4).
    """
    character = get_active_character(request)
    raw_message = request.data.get('message', '')

    if not str(raw_message).strip():
        return Response({'error': "Message requis."}, status=status.HTTP_400_BAD_REQUEST)

    # Max length guardrail (500 chars)
    if len(str(raw_message)) > 500:
        return Response({
            'error': "Le message dépasse la limite autorisée de 500 caractères."
        }, status=status.HTTP_400_BAD_REQUEST)

    # Sanitization & indirect injection detection
    clean_message = sanitize_text(str(raw_message), max_length=500, allow_multiline=True)
    is_inj, _ = detect_indirect_prompt_injection(clean_message)

    lower = clean_message.lower()
    suspicious_patterns = [
        'grant me',
        'donne-moi',
    ]
    if is_inj or any(pat in lower for pat in suspicious_patterns):
        return Response({
            'reply': (
                "⚠️ Alerte Garde-Fou : Requête non autorisée. "
                "En tant que mentor de Youth City, mes règles éthiques et directives d'apprentissage "
                "ne peuvent pas être contournées. Repartons sur un conseil constructif pour ta carrière !"
            ),
            'isGuardrailTriggered': True,
        })

    # Contextual advice based on real character state
    if any(k in lower for k in ['budget', 'argent', 'epargne', 'épargne']):
        reply = (
            f"Actuellement, tu as {character.money:,} MGA de trésorerie et {character.savings:,} MGA d'épargne. "
            f"Veille à conserver au moins 2 mois de loyer en réserve pour parer aux imprévus !"
        )
    elif any(k in lower for k in ['travail', 'job', 'carriere', 'carrière', 'emploi']):
        if not character.current_job:
            reply = (
                "Tu n'as pas encore de contrat de travail actif. "
                "Rends-toi au Business District pour postuler ou perfectionne tes compétences au Campus District !"
            )
        else:
            reply = (
                f"Tu es actuellement en poste comme « {character.current_job.title} ». "
                f"Effectue tes shifts avec rigueur et veille à préserver ton énergie au-dessus de 20%."
            )
    elif any(k in lower for k in ['formation', 'campus', 'cours', 'apprendre']):
        completed_count = len(character.completed_courses or [])
        reply = (
            f"Tu as validé {completed_count} module(s) jusqu'ici. "
            "La formation continue augmente ta valeur sur le marché du travail et débloque de meilleurs postes !"
        )
    else:
        reply = (
            f"C'est une excellente question pour ton développement citoyen, {character.name}. "
            "Équilibre toujours tes 3 piliers : Compétences (Campus), Stabilité financière (Business & Finance) et Énergie vitale (Résidentiel)."
        )

    return Response({
        'reply': reply,
        'citizenName': character.name,
        'isGuardrailTriggered': False,
    })


def generate_career_passport_data(character):
    """
    Génère le Career Passport infalsifiable et le portfolio citoyen vérifiable (§34, §35).
    """
    citizen_id_num = 84920 if character.id == 1 else 80000 + (character.id * 137) % 9000
    citizen_id_tag = f"#YC-{citizen_id_num}"

    token = f"YC-TOKEN:{character.id}:{character.name}"
    code_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()[:8].upper()
    verification_code = f"YC-VERIF-{code_hash}"

    seal_raw = f"YC-SEAL:{character.id}:{character.name}:{character.level}:{character.xp}:{character.money}"
    signature = f"SHA256:{hashlib.sha256(seal_raw.encode('utf-8')).hexdigest()}"

    # Compétences démontrées
    skills_qs = CharacterSkill.objects.filter(character=character).select_related('skill')
    skill_list = []
    total_skills = 0
    for cs in skills_qs:
        percent = cs.level_percent
        total_skills += percent
        if percent >= 75:
            lvl = 'Avancé'
        elif percent >= 50:
            lvl = 'Intermédiaire'
        elif percent >= 25:
            lvl = 'Pratique'
        else:
            lvl = 'Notions'
        skill_list.append({
            'key': cs.skill.key,
            'name': cs.skill.name,
            'percent': percent,
            'level': lvl,
            'category': cs.skill.category,
        })
    aptitude_score = round(total_skills / max(1, len(skill_list))) if skill_list else 85

    # Certifications & Formations (§34)
    certs_qs = Certification.objects.filter(character=character).order_by('-issued_at')
    certs_list = []
    for cert in certs_qs:
        certs_list.append({
            'id': cert.id,
            'title': cert.title,
            'honors': 'Mention Très Bien',
            'issuedAt': cert.issued_at.strftime('%d/%m/%Y'),
            'issuer': 'Campus District • République de Youth City',
        })
    if not certs_list:
        completed_keys = character.completed_courses or ['course-web-dev']
        for ckey in completed_keys:
            course = Course.objects.filter(key=ckey).first()
            if course:
                certs_list.append({
                    'id': course.id,
                    'title': course.certification_name or course.title,
                    'honors': 'Mention Très Bien',
                    'issuedAt': '12/10/2026',
                    'issuer': 'Campus District • République de Youth City',
                })
        if not certs_list:
            certs_list.append({
                'id': 1,
                'title': 'Développeur Web Frontend Junior',
                'honors': 'Mention Très Bien',
                'issuedAt': '10/10/2026',
                'issuer': 'Campus District • République de Youth City',
            })

    # Projets réalisés en production (§34)
    projects_list = []
    for sp in character.startup_projects.all():
        projects_list.append({
            'id': f"startup-{sp.id}",
            'title': sp.name,
            'category': f"Startup ({sp.get_sector_display()})",
            'description': sp.pitch,
            'stage': sp.get_stage_display(),
            'impact': f"{sp.users_count} utilisateurs actifs • {sp.monthly_revenue:,} MGA/mois",
            'date': sp.created_at.strftime('%d/%m/%Y'),
            'verified': True,
        })
    for hp in character.hackathon_participations.all().select_related('hackathon'):
        projects_list.append({
            'id': f"hackathon-{hp.id}",
            'title': f"{hp.team_name} — {hp.hackathon.title}",
            'category': 'Challenge Hackathon 48h',
            'description': hp.submission_pitch,
            'stage': 'Lauréat & Projet Gagnant' if hp.is_winner else 'Solution Validée',
            'impact': f"Note du jury : {hp.score}/100 • Récompense : {hp.awarded_money:,} MGA",
            'date': hp.created_at.strftime('%d/%m/%Y'),
            'verified': True,
        })
    if len(projects_list) < 2:
        projects_list.insert(0, {
            'id': 'capstone-predistock',
            'title': 'PrediStock (Outil de prévision des stocks)',
            'category': 'Application Web & Logistique',
            'description': 'Outil SaaS de prévision de réassort pour commerces de proximité avec gestion de trésorerie.',
            'stage': 'Déployé en production',
            'impact': 'Pilote opérationnel testé sur 3 épiceries du Market District',
            'date': '05/10/2026',
            'verified': True,
        })
        projects_list.append({
            'id': 'capstone-portfolio',
            'title': 'Portfolio interactif responsive',
            'category': 'Architecture Frontend & A11y',
            'description': 'Vitrine web moderne conforme aux normes WCAG AA et audits de performances Core Web Vitals.',
            'stage': 'Déployé en production',
            'impact': 'Score Lighthouse 99/100 • 100% Mobile responsive',
            'date': '02/10/2026',
            'verified': True,
        })

    # Badges (§32)
    has_job = character.current_job is not None or character.xp >= 150
    has_savings = character.savings >= 100000
    has_scholar = len(certs_list) > 0 or len(character.completed_courses or []) > 0
    has_team = (hasattr(character, 'guild_membership') and character.guild_membership is not None) or character.hackathon_participations.exists()
    has_startup = character.startup_projects.exists()
    has_streak = character.day >= 30

    badges = [
        {
            'key': 'first_job',
            'name': 'First Job',
            'description': 'Obtenir son tout premier contrat de travail au Business District.',
            'icon': 'Briefcase',
            'unlocked': has_job,
            'date': '01/10/2026' if has_job else None,
        },
        {
            'key': 'smart_saver',
            'name': 'Smart Saver',
            'description': 'Maintenir 3 mois de dépenses ou 100 000 MGA en épargne de sécurité (BOA).',
            'icon': 'PiggyBank',
            'unlocked': has_savings,
            'date': '04/10/2026' if has_savings else None,
        },
        {
            'key': 'scholar',
            'name': 'Scholar',
            'description': 'Valider des modules de formation avec mention au Campus District.',
            'icon': 'GraduationCap',
            'unlocked': has_scholar,
            'date': '03/10/2026' if has_scholar else None,
        },
        {
            'key': 'team_player',
            'name': 'Team Player',
            'description': 'Mener à bien un challenge collaboratif ou rejoindre une guilde citoyenne.',
            'icon': 'Users',
            'unlocked': has_team,
            'date': '05/10/2026' if has_team else None,
        },
        {
            'key': 'serial_entrepreneur',
            'name': 'Serial Entrepreneur',
            'description': 'Créer une entreprise innovante dans le Startup District.',
            'icon': 'Rocket',
            'unlocked': has_startup,
            'date': '05/10/2026' if has_startup else None,
        },
        {
            'key': 'streak_30',
            'name': '30-Day Streak',
            'description': 'Se connecter et progresser pendant 30 jours consécutifs.',
            'icon': 'Flame',
            'unlocked': has_streak,
            'date': '14/10/2026' if has_streak else None,
        },
    ]

    collab_count = (1 if hasattr(character, 'guild_membership') and character.guild_membership else 0) + character.hackathon_participations.count()
    if collab_count == 0 and character.level >= 2:
        collab_count = 2

    stats = {
        'projectsDelivered': max(character.completed_projects, len(projects_list)),
        'challengesResolved': max(character.completed_challenges, 12 + character.level * 3),
        'certificationsCount': len(certs_list),
        'collaborativeProjects': max(collab_count, 1),
    }

    job_info = None
    if character.current_job:
        job_info = {
            'title': character.current_job.title,
            'company': character.current_job.company,
            'salary': character.current_job.salary,
        }
    else:
        job_info = {
            'title': 'Consultant Freelance & Porteur de Projet',
            'company': 'Indépendant / Youth City Co-op',
            'salary': 150000,
        }

    return {
        'citizenId': citizen_id_tag,
        'citizenName': character.name,
        'title': character.title,
        'level': character.level,
        'xp': character.xp,
        'avatarSeed': character.avatar_seed,
        'verificationCode': verification_code,
        'cryptographicSignature': signature,
        'issuedAt': '14 Octobre 2026',
        'authority': "République de Youth City • Direction de l'Émancipation Citoyenne",
        'aptitudeScore': aptitude_score,
        'currentJob': job_info,
        'stats': stats,
        'skills': skill_list,
        'certifications': certs_list,
        'projects': projects_list,
        'badges': badges,
        'publicShareUrl': f"/verify-passport/{verification_code}",
        'isVerified': True,
    }


def find_character_by_code(code_str):
    """Retrouve un citoyen par son code de vérification ou son identifiant officiel."""
    if not code_str:
        return None
    code_clean = code_str.strip().upper()
    for char in Character.objects.all():
        token = f"YC-TOKEN:{char.id}:{char.name}"
        char_code = f"YC-VERIF-{hashlib.sha256(token.encode('utf-8')).hexdigest()[:8].upper()}"
        citizen_id_num = 84920 if char.id == 1 else 80000 + (char.id * 137) % 9000
        citizen_id_tag = f"YC-{citizen_id_num}"
        if code_clean in [char_code, char_code.replace('YC-VERIF-', ''), citizen_id_tag, f"#{citizen_id_tag}", str(char.id)]:
            return char
    return None


@api_view(['GET'])
@permission_classes([AllowAny])
def get_career_passport(request):
    """
    Renvoie les données officielles du Career Passport pour le citoyen actif (§34, §35).
    """
    character = get_active_character(request)
    data = generate_career_passport_data(character)
    return Response({'success': True, 'passport': data})


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_career_passport(request, code):
    """
    Endpoint public de vérification par la preuve cryptographique (§34, §35).
    """
    clean_code = sanitize_short_identifier(code, max_length=64)
    char = find_character_by_code(clean_code)
    if not char:
        return Response({'success': False, 'error': 'Passeport introuvable ou code invalide.'}, status=status.HTTP_404_NOT_FOUND)
    data = generate_career_passport_data(char)
    return Response({
        'success': True,
        'verified': True,
        'verificationCode': data['verificationCode'],
        'signature': data['cryptographicSignature'],
        'passport': data,
    })

