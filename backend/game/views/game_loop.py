"""Boucle de jeu : état, temps, sommeil, réinitialisation."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import connection, transaction as db_transaction
from django.conf import settings


from game.models import (
    Property,
    Character,
    Certification,
    Transaction,
    Dilemma,
    CharacterBadge,
    CourseEnrollment,
    FreelanceContract,
    GuildMembership,
    HackathonParticipation,
    StartupProject,
)
from game.serializers import (
    DilemmaSerializer,
    TransactionSerializer,
    CitizenDetailSerializer,
)
from game.badges import award_badges

from game.api_docs import (
    document,
    AdvanceDayRequest,
    ResetGameRequest,
)
from game.views.common import TIME_SLOTS, get_active_character, get_recurring_cycle_info, process_recurring_cycle_settlement
from game.views.dilemmas import evaluate_and_trigger_dynamic_event


def roll_to_next_day(character):
    """
    Passage à la journée suivante (§9) : repos nocturne, récupération d'énergie selon le logement,
    règlement mensuel si le cycle de 30 jours est franchi. Source unique de récupération d'énergie :
    l'énergie ne se régénère qu'une fois par jour de jeu.
    Retourne (énergie_récupérée, récapitulatif_de_règlement_ou_None).
    """
    character.day += 1
    character.time_slot = TIME_SLOTS[0]
    housing = character.current_housing
    recovery = housing.energy_recovery if housing else 50
    character.energy = min(100, character.energy + recovery)

    settlement_summary = None
    if (character.day > 1) and ((character.day - 1) % 30 == 0):
        settlement_summary = process_recurring_cycle_settlement(character)
    return recovery, settlement_summary


@document('Jeu', 'Santé du service (sans authentification)')
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Sonde de disponibilité (Docker/orchestrateur) : ne dépend d'aucun compte et ne renvoie aucune donnée de jeu."""
    try:
        connection.ensure_connection()
    except Exception:
        return Response({'status': 'unavailable'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    return Response({'status': 'ok'})


@document('Jeu', 'État complet de la partie')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
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


@document('Jeu', 'Avancer au créneau horaire suivant')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def advance_time(request):
    """Advances time slot or triggers overnight energy recovery and monthly settlements (§18, §20)."""
    character = get_active_character(request)
    current_slot = character.time_slot

    try:
        curr_idx = TIME_SLOTS.index(current_slot)
    except ValueError:
        curr_idx = 0

    settlement_summary = None

    with db_transaction.atomic():
        character = Character.objects.select_for_update().select_related('current_housing', 'current_job').get(id=character.id)
        if curr_idx < len(TIME_SLOTS) - 1:
            character.time_slot = TIME_SLOTS[curr_idx + 1]
            msg = f"Le temps s'écoule : {character.time_slot}"
        else:
            # Fin de journée -> repos nocturne -> jour suivant
            recovery, settlement_summary = roll_to_next_day(character)
            msg = f"Nouveau jour {character.day} ! +{recovery}% d'énergie récupérée grâce à ton logement."
            if settlement_summary and settlement_summary.get('messages'):
                msg += " " + " ".join(settlement_summary['messages'])

        # Événement dynamique contextuel périodique (§26)
        dilemma_triggered = evaluate_and_trigger_dynamic_event(character, force=False)
        character.save()

    award_badges(character)
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


@document('Jeu', "Avancer d'un ou plusieurs jours", request=AdvanceDayRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
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

    settlement_summaries = []

    with db_transaction.atomic():
        character = Character.objects.select_for_update().select_related('current_housing', 'current_job').get(id=character.id)
        for _ in range(days_to_advance):
            _, summary = roll_to_next_day(character)
            if summary:
                settlement_summaries.append(summary)
        character.save()

    # Déclenchement d'un événement contextuel (§26) sur avance de jour
    dilemma_triggered = evaluate_and_trigger_dynamic_event(character, force=(character.day % 2 == 0))
    award_badges(character)

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


@document('Jeu', 'Se reposer et dormir')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rest_and_sleep(request):
    """
    Dormir fait passer la nuit : l'énergie revient selon le confort du logement, mais le jour suivant
    commence (loyer et règlements du cycle compris). Impossible d'enchaîner les nuits sans conséquence.
    """
    character = get_active_character(request)

    with db_transaction.atomic():
        character = Character.objects.select_for_update().select_related('current_housing', 'current_job').get(id=character.id)
        recovery, settlement_summary = roll_to_next_day(character)
        character.save()

    award_badges(character)
    message = f"Nuit de repos : +{recovery}% d'énergie récupérée. Nous sommes au Jour {character.day}."
    if settlement_summary and settlement_summary.get('messages'):
        message += " " + " ".join(settlement_summary['messages'])

    return Response({
        'energy': character.energy,
        'day': character.day,
        'timeSlot': character.time_slot,
        'recurringCycle': get_recurring_cycle_info(character),
        'settlementSummary': settlement_summary,
        'message': message,
        'citizen': CitizenDetailSerializer(character).data,
    })


# --- RESET ---

@document('Jeu', 'Réinitialiser la partie', request=ResetGameRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_game(request):
    """
    Remet à zéro la partie du compte connecté (« new »). Le preset « demo » (niveau 5, 425 000 MGA)
    est un outil de développement : réservé au mode DEBUG ou au personnel, jamais aux joueurs.
    """
    preset = request.data.get('preset', 'new')
    if preset not in ('new', 'demo'):
        return Response({'error': "Preset inconnu."}, status=status.HTTP_400_BAD_REQUEST)
    if preset == 'demo' and not (settings.DEBUG or request.user.is_staff):
        return Response(
            {'error': "Le preset de démonstration est réservé aux administrateurs."},
            status=status.HTTP_403_FORBIDDEN,
        )

    character = get_active_character(request)
    is_new = preset == 'new'
    room = Property.objects.filter(key='housing-room').first() or Property.objects.first()

    with db_transaction.atomic():
        character.title = "Nouveau Citoyen de Youth City" if is_new else "Citoyen Actif"
        character.level = 1 if is_new else 5
        character.xp = 0 if is_new else 1450
        character.xp_to_next_level = 500 if is_new else 2000
        character.energy = 80 if is_new else 72
        character.wellbeing = 80 if is_new else 81
        character.money = 250000 if is_new else 425000
        character.savings = 50000 if is_new else 200000
        character.day = 1
        character.time_slot = TIME_SLOTS[0]
        character.current_housing = room
        character.current_job = None
        character.completed_courses = []
        character.completed_projects = 0
        character.completed_challenges = 0
        character.inventory = []
        character.passed_interviews = []
        character.resolved_dilemmas = []
        character.active_dilemma_key = ""
        character.onboarding_completed = not is_new
        character.last_shift_day = 0
        character.guild_bonus_claimed = False
        # Une partie remise à zéro ne doit plus être consultable via d'anciens liens publics
        character.passport_public = False
        character.passport_code = None
        character.passport_sections = {}
        character.save()

        character.skills.update(level_percent=15 if is_new else 50)

        Certification.objects.filter(character=character).delete()
        Transaction.objects.filter(character=character).delete()
        CourseEnrollment.objects.filter(character=character).delete()
        CharacterBadge.objects.filter(character=character).delete()
        StartupProject.objects.filter(character=character).delete()
        FreelanceContract.objects.filter(character=character).delete()
        HackathonParticipation.objects.filter(character=character).delete()
        GuildMembership.objects.filter(character=character).delete()

    return Response({
        'message': f"Partie réinitialisée en mode '{preset}'.",
        'citizen': CitizenDetailSerializer(character).data,
        'day': character.day,
        'timeSlot': character.time_slot,
        'transactions': [],
    })
