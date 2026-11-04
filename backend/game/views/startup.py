"""Startup District : incubateur et projets."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction

from game.sanitizers import (
    sanitize_short_identifier,
    sanitize_multiline_content,
    detect_indirect_prompt_injection,
)

from game.models import (
    Character,
    StartupProject,
)
from game.badges import award_badges
from game.serializers import (
    TransactionSerializer,
    CitizenDetailSerializer,
    StartupProjectSerializer,
)

from game.api_docs import (
    document,
    CreateStartupRequest,
    StartupActionRequest,
)
from game.views.common import add_xp_to_character, get_active_character, record_transaction

REVENUE_COLLECTION_COOLDOWN_DAYS = 30  # un encaissement par « mois » de jeu et par projet


# --- STARTUP DISTRICT (§12, §24) ---

@document('Startup', 'Lister les projets', response=StartupProjectSerializer(many=True))
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_startup_projects(request):
    """Lists startup ventures of the active citizen (§12, §24)."""
    character = get_active_character(request)
    projects = list(StartupProject.objects.filter(character=character).order_by('-created_at'))

    serializer = StartupProjectSerializer(projects, many=True)
    return Response(serializer.data)


@document('Startup', 'Créer un projet', request=CreateStartupRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
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

    slug_key = f"startup-{uuid.uuid4().hex[:8]}"

    with db_transaction.atomic():
        character = Character.objects.select_for_update().get(id=character.id)
        if character.money < capital:
            return Response({'error': f"Fonds personnels insuffisants. Tu disposes de {character.money:,} MGA."}, status=status.HTTP_400_BAD_REQUEST)

        money_before = character.money
        character.money -= capital
        level_up = add_xp_to_character(character, 80)
        character.completed_projects += 1
        character.save()

        tx = record_transaction(
            character,
            label=f"Apport capital initial : {name}",
            amount=-capital,
            transaction_type='expense',
            category='Startup',
            money_before=money_before,
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

    award_badges(character)
    return Response({
        'message': f"Félicitations ! La startup '{project.name}' a été enregistrée à l'incubateur du Startup District.",
        'project': StartupProjectSerializer(project).data,
        'citizen': CitizenDetailSerializer(character).data,
        'transaction': TransactionSerializer(tx).data,
        'levelUp': level_up,
    }, status=status.HTTP_201_CREATED)


@document('Startup', 'Faire progresser un projet', request=StartupActionRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def advance_startup_action(request, key):
    """Executes an action in the entrepreneurial pipeline (§12, §24)."""
    character = get_active_character(request)
    get_object_or_404(StartupProject, key=key, character=character)
    action_type = request.data.get('actionType')

    with db_transaction.atomic():
        character = Character.objects.select_for_update().get(id=character.id)
        project = get_object_or_404(StartupProject.objects.select_for_update(), key=key, character=character)

        if character.energy < 15:
            return Response({'error': "Énergie vitale insuffisante (min. 15%). Repose-toi au Residential District !"}, status=status.HTTP_400_BAD_REQUEST)

        character.energy -= 15
        level_up = False
        tx = None

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
            days_since_last = character.day - project.last_revenue_day
            if project.last_revenue_day and days_since_last < REVENUE_COLLECTION_COOLDOWN_DAYS:
                remaining = REVENUE_COLLECTION_COOLDOWN_DAYS - days_since_last
                return Response({
                    'error': f"Les revenus de ce mois ont déjà été encaissés. Prochain encaissement dans {remaining} jour(s) de jeu."
                }, status=status.HTTP_400_BAD_REQUEST)
            dividend = round(project.monthly_revenue * 0.5)
            project.treasury += (project.monthly_revenue - dividend)
            project.last_revenue_day = character.day
            money_before = character.money
            character.money += dividend
            tx = record_transaction(
                character,
                label=f"Dividendes Startup : {project.name}",
                amount=dividend,
                transaction_type='income',
                category='Startup',
                money_before=money_before,
            )
            message = f"Revenus encaissés : +{dividend:,} MGA en dividendes personnels et trésorerie renforcée !"

        else:
            return Response({'error': "Action entrepreneuriale inconnue."}, status=status.HTTP_400_BAD_REQUEST)

        project.save()
        character.save()

    payload = {
        'message': message,
        'project': StartupProjectSerializer(project).data,
        'citizen': CitizenDetailSerializer(character).data,
        'levelUp': level_up,
    }
    if tx is not None:
        payload['transaction'] = TransactionSerializer(tx).data
    return Response(payload)


@document('Startup', "Demander la subvention de l'incubateur")
@api_view(['POST'])
@permission_classes([IsAuthenticated])
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


