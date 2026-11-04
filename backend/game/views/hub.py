"""City Hub : guildes, hackathons, classement, annuaire et messagerie."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction
from django.db.models import Q, Count

from game.sanitizers import (
    sanitize_text,
    sanitize_short_identifier,
    sanitize_multiline_content,
    detect_indirect_prompt_injection,
)

from game.models import (
    Character,
    Guild,
    GuildMembership,
    Hackathon,
    HackathonParticipation,
    CitizenMessage,
    UserBlock,
)
from game.serializers import (
    TransactionSerializer,
    CitizenDetailSerializer,
    GuildSerializer,
    HackathonSerializer,
    HackathonParticipationSerializer,
    CitizenDirectorySerializer,
    CitizenMessageSerializer,
)

from game.api_docs import (
    document,
    ParticipateHackathonRequest,
    SendMessageRequest,
)
from game import policy
from game.badges import award_badges
from game.views.common import add_xp_to_character, get_active_character, record_transaction


# --- CITY HUB : GUILDES, HACKATHONS & COMMUNAUTÉ (§13, §29, §30, §31, §33) ---

@document('City Hub', 'Lister les guildes', response=GuildSerializer(many=True))
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_guilds(request):
    """Lists professional guilds in City Hub with membership status (§13, §30)."""
    character = get_active_character(request)
    guilds = Guild.objects.all().order_by('-member_count')
    serializer = GuildSerializer(guilds, many=True, context={'character': character})
    return Response(serializer.data)


@document('City Hub', 'Rejoindre une guilde')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def join_guild(request, key):
    """Joins a guild, gaining guild perks and welcome XP (§13, §30)."""
    character = get_active_character(request)
    guild = get_object_or_404(Guild, key=key)

    with db_transaction.atomic():
        character = Character.objects.select_for_update().get(id=character.id)
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

        # Bonus de bienvenue : une seule fois par citoyen (ni en changeant de guilde, ni en quittant puis en revenant).
        level_up = False
        if not character.guild_bonus_claimed:
            character.guild_bonus_claimed = True
            level_up = add_xp_to_character(character, 50)
            character.save()

    award_badges(character)
    return Response({
        'message': message,
        'guild': GuildSerializer(guild, context={'character': character}).data,
        'citizen': CitizenDetailSerializer(character).data,
        'levelUp': level_up,
    })


@document('City Hub', 'Quitter une guilde')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
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


@document('City Hub', 'Lister les hackathons', response=HackathonSerializer(many=True))
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_hackathons(request):
    """Lists collaborative hackathons and challenges at City Hub (§13, §31)."""
    character = get_active_character(request)
    hackathons = list(Hackathon.objects.all().order_by('-created_at'))
    my_parts = {
        p.hackathon_id: HackathonParticipationSerializer(p).data
        for p in HackathonParticipation.objects.filter(character=character, hackathon__in=hackathons)
    }
    serializer = HackathonSerializer(
        hackathons,
        many=True,
        context={'character': character, 'my_participations': my_parts}
    )
    return Response(serializer.data)


@document('City Hub', 'Participer à un hackathon', request=ParticipateHackathonRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
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
        character = Character.objects.select_for_update().get(id=character.id)
        if hackathon.participations.filter(character=character).exists():
            return Response({'error': "Ton équipe a déjà soumis son projet pour ce hackathon."}, status=status.HTTP_400_BAD_REQUEST)
        if character.energy < 20:
            return Response({'error': "Énergie insuffisante pour un sprint de 48h (min. 20%). Repose-toi au Residential District !"}, status=status.HTTP_400_BAD_REQUEST)

        money_before = character.money
        character.energy = max(5, character.energy - 20)
        character.money += individual_money
        character.completed_challenges += 1
        level_up = add_xp_to_character(character, individual_xp)
        character.save()

        tx = record_transaction(
            character,
            label=f"Hackathon : {hackathon.title} ({'1er Prix' if is_winner else 'Prix d\'Honneur'})",
            amount=individual_money,
            transaction_type='income',
            category='Hackathon',
            money_before=money_before,
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

    award_badges(character)
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


@document('City Hub', 'Classement de la communauté')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_community_leaderboard(request):
    """Returns healthy thematic leaderboards without anxiety-inducing metrics (§33)."""
    character = get_active_character(request)
    visible = policy.visible_citizens(character, Character.objects.filter(user__isnull=False), 'show_in_leaderboard')
    top_citizens = visible.values(
        'id', 'name', 'title', 'level', 'xp', 'completed_challenges', 'completed_projects', 'savings'
    ).order_by('-xp')[:10]
    citizens_data = [
        {
            'id': c['id'],
            'name': c['name'],
            'title': c['title'],
            'level': c['level'],
            'xp': c['xp'],
            'completedChallenges': c['completed_challenges'],
            'completedProjects': c['completed_projects'],
            'savings': c['savings'],
        }
        for c in top_citizens
    ]

    category_display_map = dict(Guild.CATEGORY_CHOICES)
    top_guilds = Guild.objects.values(
        'key', 'name', 'category', 'member_count', 'motto'
    ).order_by('-member_count')[:5]
    guilds_data = [
        {
            'id': g['key'],
            'name': g['name'],
            'category': category_display_map.get(g['category'], g['category']),
            'memberCount': g['member_count'],
            'motto': g['motto'],
        }
        for g in top_guilds
    ]

    return Response({
        'topCitizens': citizens_data,
        'topGuilds': guilds_data,
    })


# --- ANNUAIRE CITOYEN & MESSAGERIE SOCIALE DIRECTE (§29) ---

@document('City Hub', 'Annuaire des citoyens', response=CitizenDirectorySerializer(many=True))
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_citizen_directory(request):
    """
    Annuaire public des citoyens au City Hub (§29).
    Liste les profils citoyens avec compétences, guilde, poste et statut pour favoriser l'émulation saine.
    """
    character = get_active_character(request)
    unread_counts = {}
    if character:
        counts_qs = (
            CitizenMessage.objects
            .filter(recipient=character, is_read=False)
            .values('sender_id')
            .annotate(count=Count('id'))
        )
        unread_counts = {item['sender_id']: item['count'] for item in counts_qs}

    visible_ids = policy.visible_citizens(character, Character.objects.all(), 'show_in_directory').values('id')
    citizens = (
        Character.objects.filter(Q(id__in=visible_ids) | Q(user__isnull=True))
        .exclude(id__in=policy.blocked_ids(character))
        .select_related('current_job', 'guild_membership__guild')
        .prefetch_related('certifications')
        .order_by('-level', '-xp')
    )
    serializer = CitizenDirectorySerializer(
        citizens,
        many=True,
        context={'character': character, 'unread_counts': unread_counts}
    )
    return Response(serializer.data)


@document('City Hub', 'Messages du citoyen', response=CitizenMessageSerializer(many=True))
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_citizen_messages(request):
    """
    Liste les messages directs de la messagerie instantanée (§29).
    Prend optionnellement `contact_id` pour charger le fil de conversation spécifique.
    """
    character = get_active_character(request)
    contact_id = request.query_params.get('contact_id')

    if contact_id:
        try:
            cid = int(contact_id)
        except (ValueError, TypeError):
            return Response({'error': 'ID de contact invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        # Marque comme lus les messages reçus de ce contact
        CitizenMessage.objects.filter(sender_id=cid, recipient=character, is_read=False).update(is_read=True)

        messages = CitizenMessage.objects.filter(
            (Q(sender=character, recipient_id=cid) | Q(sender_id=cid, recipient=character))
        ).select_related('sender', 'recipient').order_by('created_at')
    else:
        messages = CitizenMessage.objects.filter(
            Q(sender=character) | Q(recipient=character)
        ).select_related('sender', 'recipient').order_by('created_at')

    blocked = policy.blocked_ids(character)
    messages = messages.filter(is_hidden=False).exclude(sender_id__in=blocked).exclude(recipient_id__in=blocked)

    serializer = CitizenMessageSerializer(messages, many=True, context={'character': character})
    return Response(serializer.data)


@document('City Hub', 'Envoyer un message', request=SendMessageRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_citizen_message(request):
    """
    Envoi d'un message direct dans le cadre de l'apprentissage collaboratif (§29).
    Protégé par les garde-fous OWASP (longueur max, désinfection de texte, anti-injection).
    Si le destinataire est un citoyen simulé, engendre une réponse de pair constructive.
    """
    character = get_active_character(request)
    recipient_id = request.data.get('recipientId')
    raw_content = request.data.get('content', '')
    context_tag = request.data.get('contextTag', 'collaboration')

    if not recipient_id:
        return Response({'error': "Destinataire requis."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        rid = int(recipient_id)
    except (ValueError, TypeError):
        return Response({'error': "Identifiant destinataire invalide."}, status=status.HTTP_400_BAD_REQUEST)

    if rid == character.id:
        return Response({'error': "Impossible d'envoyer un message à soi-même."}, status=status.HTTP_400_BAD_REQUEST)

    recipient = Character.objects.filter(id=rid).first()
    # Un citoyen qui n'apparaît pas dans l'annuaire du joueur est « introuvable » : pas de contact par devinette d'identifiant
    if not recipient or (
        not recipient.is_simulated
        and not policy.visible_citizens(character, Character.objects.filter(id=recipient.id), 'show_in_directory').exists()
    ):
        return Response({'error': "Citoyen destinataire introuvable."}, status=status.HTTP_404_NOT_FOUND)

    allowed, reason = policy.can_message(character, recipient)
    if not allowed:
        return Response({'error': reason}, status=status.HTTP_403_FORBIDDEN)

    clean_content = sanitize_text(str(raw_content), max_length=500, allow_multiline=True)
    if not clean_content.strip():
        return Response({'error': "Le contenu du message ne peut pas être vide."}, status=status.HTTP_400_BAD_REQUEST)

    is_inj, _ = detect_indirect_prompt_injection(clean_content)
    if is_inj:
        return Response({'error': "Contenu non autorisé détecté par le filtre éthique (§OWASP)."}, status=status.HTTP_400_BAD_REQUEST)

    msg = CitizenMessage.objects.create(
        sender=character,
        recipient=recipient,
        content=clean_content,
        context_tag=context_tag,
    )

    # Réponse constructive de pair pour les citoyens pairs simulés (§29)
    auto_reply = None
    if recipient.user is None or recipient.user.username != character.user.username:
        recip_lower = recipient.name.lower()
        if 'aina' in recip_lower:
            reply_text = (
                f"Salut {character.name} ! J'ai bien reçu ton message. Tes progrès récents au Campus District sont impressionnants ! "
                "Je serais ravie de concevoir les maquettes UI/UX pour ton prochain livrable ou pour le Hackathon du City Hub."
            )
        elif 'rova' in recip_lower:
            reply_text = (
                f"Hello {character.name} ! Super initiative de prendre contact. Le travail en équipe et l'architecture logicielle "
                "sont indispensables pour faire grandir nos startups à Madagascar. Restons connectés sur ce projet !"
            )
        elif 'andry' in recip_lower:
            reply_text = (
                f"Bonjour {character.name} ! Bien reçu. La rigueur financière et le suivi des métriques d'épargne "
                "sont le socle de toute entreprise pérenne. Faisons un point sur le business plan dès que tu as un moment !"
            )
        elif 'mialy' in recip_lower:
            reply_text = (
                f"Salama {character.name} ! Très heureuse d'échanger. Les initiatives à fort impact social et écologiques "
                "ont tout leur sens sur Youth City. Collaborons pour faire bouger les lignes !"
            )
        else:
            reply_text = (
                f"Salama {character.name} ! Merci pour ton message. Ravis de collaborer avec toi sur Youth City "
                "pour faire progresser nos projets et notre communauté citoyenne !"
            )

        auto_reply = CitizenMessage.objects.create(
            sender=recipient,
            recipient=character,
            content=reply_text,
            context_tag=context_tag,
            is_read=False,
        )

    return Response({
        'success': True,
        'message': CitizenMessageSerializer(msg, context={'character': character}).data,
        'autoReply': CitizenMessageSerializer(auto_reply, context={'character': character}).data if auto_reply else None,
    })


@document('City Hub', 'Marquer un message comme lu')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_message_read(request, message_id):
    """Marque un message comme lu (§29)."""
    character = get_active_character(request)
    msg = get_object_or_404(CitizenMessage, id=message_id, recipient=character)
    msg.is_read = True
    msg.save()
    return Response({'success': True, 'messageId': msg.id})


# --- BLOCAGE DE CITOYENS (§19.2) ---

@document('City Hub', 'Citoyens que j\'ai bloqués')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_blocks(request):
    character = get_active_character(request)
    blocks = UserBlock.objects.filter(blocker=character).select_related('blocked')
    return Response([
        {'id': b.blocked_id, 'name': b.blocked.name, 'avatarSeed': b.blocked.avatar_seed, 'blockedAt': b.created_at.isoformat()}
        for b in blocks
    ])


@document('City Hub', 'Bloquer ou débloquer un citoyen')
@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def toggle_block(request, citizen_id):
    """POST bloque, DELETE débloque. Un citoyen bloqué ne peut plus écrire ni être vu, dans les deux sens."""
    character = get_active_character(request)
    if citizen_id == character.id:
        return Response({'error': "Tu ne peux pas te bloquer toi-même."}, status=status.HTTP_400_BAD_REQUEST)
    target = get_object_or_404(Character, id=citizen_id)

    if request.method == 'DELETE':
        UserBlock.objects.filter(blocker=character, blocked=target).delete()
        return Response({'message': f"{target.name} est débloqué(e).", 'blocked': False})

    UserBlock.objects.get_or_create(blocker=character, blocked=target)
    return Response({'message': f"{target.name} est bloqué(e).", 'blocked': True}, status=status.HTTP_201_CREATED)
