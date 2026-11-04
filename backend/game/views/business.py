"""Business District : emplois, entretiens, shifts et missions freelance."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction
from django.db.models import Count, Sum
from django.db.models.functions import Coalesce


from game.models import (
    Job,
    Character,
    FreelanceGig,
    FreelanceContract,
)
from game.serializers import (
    JobSerializer,
    TransactionSerializer,
    CitizenDetailSerializer,
    FreelanceGigSerializer,
    FreelanceContractSerializer,
)

from game.api_docs import (
    document,
    InterviewAnswerRequest,
)
from game.badges import award_badges
from game.views.common import add_xp_to_character, get_active_character, record_transaction


# --- BUSINESS DISTRICT ---

@document('Business', "Lister les offres d'emploi", response=JobSerializer(many=True))
@api_view(['GET'])
@permission_classes([AllowAny])
def list_jobs(request):
    """Lists available employment offers in the Business District."""
    jobs = Job.objects.all()
    return Response(JobSerializer(jobs, many=True).data)


def missing_requirement_message(character, job):
    """Retourne un message d'erreur si une compétence requise manque, sinon None (§11.2 étape 2)."""
    char_skills = {cs.skill.key: cs.level_percent for cs in character.skills.select_related('skill')}
    for req in job.requirements or []:
        skill_key = req.get('skillKey')
        req_val = req.get('requiredPercent', 0)
        curr_val = char_skills.get(skill_key, 0)
        if curr_val < req_val:
            return (
                f"Compétence insuffisante en {req.get('skillName', skill_key)} "
                f"({curr_val}% actuel vs {req_val}% requis). Révise au Campus District !"
            )
    return None


@document('Business', 'Signer le contrat après un entretien réussi')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def hire_job(request, key):
    """
    Signe le contrat d'une offre dont l'entretien simulé a déjà été réussi (§11.2).
    Aucune XP ici : elle est attribuée une seule fois, à la réussite de l'entretien.
    """
    job = get_object_or_404(Job, key=key)
    character = get_active_character(request)

    with db_transaction.atomic():
        character = Character.objects.select_for_update().select_related('current_housing', 'current_job').get(id=character.id)

        if character.current_job_id == job.id:
            return Response({'error': "Tu occupes déjà ce poste."}, status=status.HTTP_400_BAD_REQUEST)

        error = missing_requirement_message(character, job)
        if error:
            return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

        if job.key not in (character.passed_interviews or []):
            return Response(
                {'error': "Réussis d'abord l'entretien simulé pour cette offre."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        character.current_job = job
        character.save()

    return Response({
        'message': f"Contrat signé : {job.title} chez {job.company}.",
        'job': JobSerializer(job).data,
        'levelUp': False,
        'citizen': CitizenDetailSerializer(character).data,
    })


@document('Business', 'Passer un entretien simulé', request=InterviewAnswerRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_interview(request, key):
    """Simulates a job interview with pedagogical criteria analysis and hiring decision (§8, §22)."""
    character = get_active_character(request)
    job = get_object_or_404(Job, key=key)

    # 1. Poste déjà occupé / prérequis de compétences
    if character.current_job_id == job.id:
        return Response({'error': "Tu occupes déjà ce poste."}, status=status.HTTP_400_BAD_REQUEST)
    error = missing_requirement_message(character, job)
    if error:
        return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)

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
        character = Character.objects.select_for_update().select_related('current_housing', 'current_job').get(id=character.id)
        if hired:
            passed = list(character.passed_interviews or [])
            first_pass = job.key not in passed
            character.current_job = job
            if first_pass:
                passed.append(job.key)
                character.passed_interviews = passed
                level_up = add_xp_to_character(character, 100)  # +100 XP, une seule fois par offre
            character.save()

    if hired:
        award_badges(character)

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



@document('Business', 'Effectuer un shift de travail')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def work_shift(request):
    """Executes a work shift, earning daily salary in MGA and consuming energy."""
    character = get_active_character(request)
    if not character.current_job:
        return Response({
            'error': "Aucun emploi actif. Postule d'abord au Business District !"
        }, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        character = Character.objects.select_for_update().get(id=character.id)
        job = character.current_job
        if not job:
            return Response({
                'error': "Aucun emploi actif. Postule d'abord au Business District !"
            }, status=status.HTTP_400_BAD_REQUEST)

        if character.energy < job.energy_per_shift:
            return Response({
                'error': "Énergie insuffisante pour accomplir ce shift. Repose-toi au Residential District !"
            }, status=status.HTTP_400_BAD_REQUEST)

        if character.last_shift_day == character.day:
            return Response({
                'error': "Tu as déjà travaillé aujourd'hui. Passe à la journée suivante pour effectuer un nouveau shift."
            }, status=status.HTTP_400_BAD_REQUEST)

        daily_salary = round(job.salary / 20)
        money_before = character.money
        character.money += daily_salary
        character.energy -= job.energy_per_shift
        character.last_shift_day = character.day
        level_up = add_xp_to_character(character, 40)
        character.save()

        tx = record_transaction(
            character,
            label=f"Salaire journalier — {job.title}",
            amount=daily_salary,
            transaction_type='income',
            category='Salaire',
            money_before=money_before,
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

@document('Business', 'Lister les missions freelance')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_freelance_gigs(request):
    """Lists available freelance gigs with citizen eligibility & past contracts (§52)."""
    character = get_active_character(request)
    gigs = list(FreelanceGig.objects.filter(is_active=True).order_by('id'))

    skills_map = dict(character.skills.values_list('skill__key', 'level_percent'))
    category_map = dict(character.skills.values_list('skill__category', 'level_percent'))
    contracts_map = dict(character.freelance_contracts.values('gig_id').annotate(c=Count('id')).values_list('gig_id', 'c'))

    serializer = FreelanceGigSerializer(
        gigs,
        many=True,
        context={
            'character': character,
            'skills_map': skills_map,
            'category_map': category_map,
            'contracts_map': contracts_map,
        }
    )

    contracts = character.freelance_contracts.select_related('gig').order_by('-completed_at')[:10]
    contracts_data = FreelanceContractSerializer(contracts, many=True).data

    stats = character.freelance_contracts.aggregate(
        totalEarned=Coalesce(Sum('payout'), 0),
        totalCompleted=Count('id')
    )

    return Response({
        'success': True,
        'gigs': serializer.data,
        'contracts': contracts_data,
        'stats': stats,
    })


@document('Business', 'Réaliser une mission freelance')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_freelance_gig(request, key):
    """Executes a short-term freelance contract, consuming energy and earning immediate MGA (§52)."""
    character = get_active_character(request)
    gig = get_object_or_404(FreelanceGig, key=key, is_active=True)

    with db_transaction.atomic():
        character = Character.objects.select_for_update().get(id=character.id)
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

        money_before = character.money
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

        tx = record_transaction(
            character,
            label=f"Mission Freelance — {gig.title} ({gig.client_name})",
            amount=gig.reward_money,
            transaction_type='income',
            category='Freelance',
            money_before=money_before,
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



