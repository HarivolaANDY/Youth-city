"""Back-office d'administration, modération et analytics d'impact."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
import logging
from django.utils import timezone
from django.db import transaction as db_transaction
from django.db.models import Q, Count, Sum

from game.sanitizers import (
    sanitize_short_identifier,
    sanitize_multiline_content,
    detect_indirect_prompt_injection,
)

from game.models import (
    Character,
    Certification,
    StartupProject,
    Guild,
    HackathonParticipation,
    ModerationReport,
    CitizenMessage,
)
from game.serializers import (
    TransactionSerializer,
    CitizenDetailSerializer,
    ModerationReportSerializer,
)

from game.api_docs import (
    document,
    CreateReportRequest,
    GrantStipendRequest,
    ResolveReportRequest,
)
from game.views.common import get_active_character, record_transaction

logger = logging.getLogger('game.admin')


# ============================================================
# 🛡️ Back-Office d'Administration, Modération & Analytics d'Impact (§43, §45, §46)
# ============================================================

@document('Administration', "Vue d'ensemble et métriques d'impact (admin)")
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
    aggregates = Character.objects.aggregate(
        total_money=Sum('money'),
        total_savings=Sum('savings')
    )
    total_money = aggregates['total_money'] or 0
    total_savings = aggregates['total_savings'] or 0
    avg_wealth = round((total_money + total_savings) / total_citizens) if total_citizens > 0 else 0

    all_completed = sum(len(c.completed_courses or []) for c in Character.objects.only('completed_courses'))
    total_certs = Certification.objects.count()
    startup_agg = StartupProject.objects.aggregate(
        total=Count('id'),
        funded=Count('id', filter=Q(has_incubator_grant=True))
    )
    total_startups = startup_agg['total']
    funded_startups = startup_agg['funded']
    total_hackathons = HackathonParticipation.objects.count()
    total_guilds = Guild.objects.count()

    report_agg = ModerationReport.objects.aggregate(
        pending=Count('id', filter=Q(status='pending')),
        resolved=Count('id', filter=Q(status='resolved'))
    )
    pending_reports = report_agg['pending']
    resolved_reports = report_agg['resolved']

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
        for c in Character.objects.select_related('current_job').order_by('-id')[:10]
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


@document('Administration', 'Lister les signalements (admin)', response=ModerationReportSerializer(many=True))
@api_view(['GET'])
@permission_classes([IsAdminUser])
def list_moderation_reports(request):
    """
    Liste les signalements citoyens pour examen et modération éthique (§43).
    Lecture seule : les cas d'exemple sont créés par `seed_game_data --demo-citizen`.
    """
    status_filter = request.query_params.get('status')
    queryset = ModerationReport.objects.all().order_by('-created_at')
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    serializer = ModerationReportSerializer(queryset, many=True)
    return Response(serializer.data)


@document('Administration', 'Créer un signalement', request=CreateReportRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
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


@document('Administration', 'Traiter un signalement (admin)', request=ResolveReportRequest)
@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_moderation_report(request, report_id):
    """
    Modère et clôture un signalement (§32, §43) : la décision est validée, appliquée, tracée et réversible.
    - warning    : avertissement consigné ;
    - quarantine : le message visé est masqué (target_type « chat_message » / « citizen_message ») ;
    - ban        : le compte visé est suspendu (target_type « citizen_profile », target_id = id du citoyen) ;
    - none       : aucune action. Passer d'une sanction à « none » ou « warning » la lève (recours).
    """
    report = get_object_or_404(ModerationReport, id=report_id)
    action = request.data.get('action', 'none')
    new_status = request.data.get('status', 'resolved')
    moderator_notes = str(request.data.get('notes', '')).strip()[:1000]

    if action not in dict(ModerationReport.ACTION_CHOICES):
        return Response({'error': "Action de modération inconnue."}, status=status.HTTP_400_BAD_REQUEST)
    if new_status not in dict(ModerationReport.STATUS_CHOICES):
        return Response({'error': "Statut de signalement inconnu."}, status=status.HTTP_400_BAD_REQUEST)

    target_character = None
    target_message = None
    if str(report.target_id).isdigit():
        if report.target_type in ('citizen_profile', 'citizen'):
            target_character = Character.objects.filter(id=int(report.target_id)).select_related('user').first()
        elif report.target_type in ('chat_message', 'citizen_message'):
            target_message = CitizenMessage.objects.filter(id=int(report.target_id)).first()

    if action == 'ban':
        if target_character is None or target_character.user is None:
            return Response({'error': "Ce signalement ne vise pas un compte citoyen suspendable."}, status=status.HTTP_400_BAD_REQUEST)
        if target_character.user.is_staff or target_character.user_id == request.user.id:
            return Response({'error': "Un compte administrateur (ou le vôtre) ne peut pas être suspendu ici."}, status=status.HTTP_400_BAD_REQUEST)
    if action == 'quarantine' and target_message is None:
        return Response({'error': "Ce signalement ne vise pas un message pouvant être mis en quarantaine."}, status=status.HTTP_400_BAD_REQUEST)

    previous = report.action_taken
    effects = []
    with db_transaction.atomic():
        # Levée d'une sanction précédente (recours)
        if previous == 'ban' and action != 'ban' and target_character is not None and target_character.user is not None:
            target_character.user.is_active = True
            target_character.user.save(update_fields=['is_active'])
            effects.append("compte réactivé")
        if previous == 'quarantine' and action != 'quarantine' and target_message is not None:
            target_message.is_hidden = False
            target_message.save(update_fields=['is_hidden'])
            effects.append("message rétabli")

        if action == 'ban' and previous != 'ban':
            target_character.user.is_active = False
            target_character.user.save(update_fields=['is_active'])
            effects.append("compte suspendu")
        if action == 'quarantine' and previous != 'quarantine':
            target_message.is_hidden = True
            target_message.save(update_fields=['is_hidden'])
            effects.append("message masqué")

        report.action_taken = action
        report.status = new_status
        if moderator_notes:
            report.moderator_notes = moderator_notes
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()

    logger.warning(
        "Modération : signalement #%s (%s/%s) -> action=%s statut=%s par %s%s",
        report.id, report.target_type, report.target_id, action, new_status, request.user.username,
        f" [{', '.join(effects)}]" if effects else '',
    )

    return Response({
        'message': f"Signalement #{report.id} traité avec succès. Action appliquée : {report.get_action_taken_display()}.",
        'effects': effects,
        'report': ModerationReportSerializer(report).data,
    })


@document('Administration', 'Octroyer une bourse (admin)', request=GrantStipendRequest)
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

    with db_transaction.atomic():
        target_character = Character.objects.select_for_update().get(id=target_character.id)
        money_before = target_character.money
        target_character.money += amount
        target_character.save()

        tx = record_transaction(
            target_character,
            label=reason,
            amount=amount,
            transaction_type='income',
            category='Bourse Administrative',
            money_before=money_before,
        )
        logger.warning(
            "Bourse administrative : %s MGA accordés à %s (id %s) par %s — motif : %s",
            amount, target_character.name, target_character.id, request.user.username, reason,
        )

    return Response({
        'message': f"Bourse administrative de {amount:,} MGA accordée avec succès à {target_character.name}.",
        'citizen': CitizenDetailSerializer(target_character).data,
        'transaction': TransactionSerializer(tx).data,
    })


