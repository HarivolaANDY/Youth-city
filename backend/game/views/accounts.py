"""Authentification, comptes et création du personnage."""
import logging
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction as db_transaction
from django.contrib.auth import authenticate
from django.utils import timezone
from game import policy
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

from game.throttles import LoginRateThrottle, RegisterRateThrottle
from game.sanitizers import (
    sanitize_short_identifier,
    detect_indirect_prompt_injection,
)

logger = logging.getLogger('game.auth')

from game.models import (
    Skill,
    Character,
    CharacterSkill,
    Transaction,
)
from game.serializers import (
    TransactionSerializer,
    CitizenDetailSerializer,
    UserSerializer,
    RegisterSerializer,
    CharacterCustomizeSerializer,
)

from game.api_docs import (
    document,
    LoginRequest,
)
from game.views.common import (
    ARCHETYPES, TIME_SLOTS, VOCATIONS, create_initial_character_for_user, get_active_character, record_transaction,
)


# --- AUTHENTICATION & COMPTES (§42, §47) ---

@document('Auth', 'Créer un compte', request=RegisterSerializer)
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
    birth_year = serializer.validated_data['birthYear']
    is_minor = policy.age_group_for_birth_year(birth_year) == 'minor'

    with db_transaction.atomic():
        user = User.objects.create_user(username=username, email=email, password=password)
        character = create_initial_character_for_user(user, name=citizen_name)
        now = timezone.now()
        character.birth_year = birth_year
        character.terms_accepted_at = now
        if is_minor:
            # Protection des mineurs (§31.1) : consentement tracé, profil non exposé par défaut
            character.guardian_consent_at = now
            character.show_in_directory = False
            character.show_in_leaderboard = False
        character.save()

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


@document('Auth', 'Se connecter (JWT)', request=LoginRequest)
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


@document('Auth', "Profil de l'utilisateur connecté")
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Returns currently authenticated user profile and their citizen stats."""
    character = get_active_character(request)
    return Response({
        'user': UserSerializer(request.user).data,
        'citizen': CitizenDetailSerializer(character).data,
    })


@document('Auth', 'Créer / personnaliser le personnage', request=CharacterCustomizeSerializer)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def customize_character(request):
    """Customizes active citizen avatar with chosen archetype, appearance, and initial vocation (§14, §47)."""
    serializer = CharacterCustomizeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data
    character = get_active_character(request)
    if character.onboarding_completed:
        return Response(
            {'error': "Ton personnage est déjà créé. Utilise « Nouvelle partie » pour recommencer depuis zéro."},
            status=status.HTTP_409_CONFLICT,
        )
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
        skills_by_key = {s.key: s for s in Skill.objects.filter(key__in=archetype_data['skills'].keys())}
        existing_cs = {cs.skill_id: cs for cs in CharacterSkill.objects.filter(character=character, skill__key__in=archetype_data['skills'].keys())}
        to_update, to_create = [], []
        for skill_key, level in archetype_data['skills'].items():
            skill_obj = skills_by_key.get(skill_key)
            if not skill_obj:
                continue
            if skill_obj.id in existing_cs:
                cs = existing_cs[skill_obj.id]
                cs.level_percent = level
                to_update.append(cs)
            else:
                to_create.append(CharacterSkill(character=character, skill=skill_obj, level_percent=level))
        if to_update:
            CharacterSkill.objects.bulk_update(to_update, ['level_percent'])
        if to_create:
            CharacterSkill.objects.bulk_create(to_create)

        # Reset transactions & record initial stipend
        Transaction.objects.filter(character=character).delete()
        character.onboarding_completed = True
        character.save()
        initial_tx = record_transaction(
            character,
            label=f"Dotation d'accueil ({archetype_data['title']})",
            amount=character.money,
            transaction_type='income',
            category='Bienvenue',
            money_before=0,
        )

    return Response({
        'message': f"Bienvenue à Youth City, {character.name} ! Ton profil de citoyen est prêt.",
        'citizen': CitizenDetailSerializer(character).data,
        'transactions': TransactionSerializer([initial_tx], many=True).data,
    })


@document('Auth', "Déclarer son année de naissance (comptes créés avant la protection des mineurs)")
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def declare_age(request):
    """
    Les comptes sans âge connu sont traités comme mineurs (précaution). Cette déclaration est possible une seule fois :
    changer d'âge ensuite ferait basculer le joueur de tranche de protection, donc seul un administrateur peut le corriger.
    """
    character = get_active_character(request)
    if character.birth_year is not None:
        return Response({'error': "Ton année de naissance est déjà enregistrée."}, status=status.HTTP_409_CONFLICT)

    try:
        birth_year = int(request.data.get('birthYear'))
    except (ValueError, TypeError):
        return Response({'error': "L'année de naissance doit être un nombre."}, status=status.HTTP_400_BAD_REQUEST)
    error = policy.validate_birth_year(birth_year)
    if error:
        return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
    if request.data.get('acceptTerms') is not True:
        return Response({'error': "L'acceptation des conditions d'utilisation est obligatoire."}, status=status.HTTP_400_BAD_REQUEST)

    is_minor = policy.age_group_for_birth_year(birth_year) == 'minor'
    if is_minor and request.data.get('guardianConsent') is not True:
        return Response(
            {'error': "Un accord du représentant légal est requis pour les moins de 18 ans."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    now = timezone.now()
    character.birth_year = birth_year
    character.terms_accepted_at = now
    if is_minor:
        character.guardian_consent_at = now
        character.show_in_directory = False
        character.show_in_leaderboard = False
    character.save()
    return Response({'message': "Merci, ton profil est à jour.", 'citizen': CitizenDetailSerializer(character).data})


@document('Auth', 'Paramètres de confidentialité (annuaire, classements)')
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def privacy_settings(request):
    """Le joueur choisit s'il apparaît dans l'annuaire et les classements (§19.2, §21)."""
    character = get_active_character(request)
    if request.method == 'POST':
        updates = {}
        for payload_key, field in (('showInDirectory', 'show_in_directory'), ('showInLeaderboard', 'show_in_leaderboard')):
            if payload_key in request.data:
                value = request.data[payload_key]
                if not isinstance(value, bool):
                    return Response({'error': f"{payload_key} doit être vrai ou faux."}, status=status.HTTP_400_BAD_REQUEST)
                updates[field] = value
        for field, value in updates.items():
            setattr(character, field, value)
        if updates:
            character.save(update_fields=list(updates.keys()))
    return Response({
        'showInDirectory': character.show_in_directory,
        'showInLeaderboard': character.show_in_leaderboard,
    })
