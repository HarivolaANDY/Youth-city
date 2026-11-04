"""Career Passport (§22) : profil de compétences construit uniquement à partir de faits enregistrés.

Règles :
- aucune donnée de remplissage : un passeport vide reste vide ;
- le joueur choisit s'il est public et quelles sections le sont (§22.1) ;
- la publication passe par un code aléatoire, révocable, impossible à deviner ou à énumérer ;
- la vérification publique ne lit que les passeports publiés, avec les sections autorisées ;
- ce n'est pas un diplôme : les certifications sont internes à YOUTH CITY (§13.3).
"""
import hashlib
import hmac
import json
import secrets

from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status

from game import policy
from game.sanitizers import (
    sanitize_short_identifier,
)
from game.models import (
    Badge,
    Character,
    CharacterSkill,
    Certification,
)
from game.throttles import PassportVerifyRateThrottle
from game.api_docs import (
    document,
)
from game.views.common import get_active_character

DEMONSTRATED_SKILL_THRESHOLD = 25  # en dessous, la compétence est « en cours », pas encore démontrée
ISSUER = "Campus District • YOUTH CITY (certification interne, sans valeur de diplôme officiel)"
AUTHORITY = "YOUTH CITY • Simulation éducative — les indicateurs ne remplacent aucune qualification officielle"


def passport_sections(character):
    """Sections publiques effectives : tout est visible par défaut une fois publié, sauf choix contraire."""
    stored = character.passport_sections or {}
    return {name: bool(stored.get(name, True)) for name in policy.PASSPORT_SECTIONS}


def _sign(payload):
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
    digest = hmac.new(settings.SECRET_KEY.encode('utf-8'), canonical.encode('utf-8'), hashlib.sha256).hexdigest()
    return f"HMAC-SHA256:{digest}"


def _skill_level_label(percent):
    if percent >= 75:
        return 'Avancé'
    if percent >= 50:
        return 'Intermédiaire'
    return 'Pratique'


def generate_career_passport_data(character, *, owner):
    """
    Construit le passeport à partir des données réelles du citoyen.
    `owner=True` : vue complète du joueur. `owner=False` : vue publique, limitée aux sections choisies.
    """
    sections = passport_sections(character)

    def visible(name):
        return owner or sections[name]

    skills = []
    for cs in CharacterSkill.objects.filter(character=character).select_related('skill').order_by('-level_percent'):
        if cs.level_percent >= DEMONSTRATED_SKILL_THRESHOLD:
            skills.append({
                'key': cs.skill.key,
                'name': cs.skill.name,
                'percent': cs.level_percent,
                'level': _skill_level_label(cs.level_percent),
                'category': cs.skill.category,
            })
    aptitude_score = round(sum(s['percent'] for s in skills) / len(skills)) if skills else 0

    certifications = [
        {
            'id': cert.id,
            'title': cert.title,
            'honors': 'Parcours validé par quiz',
            'issuedAt': cert.issued_at.strftime('%d/%m/%Y'),
            'issuer': ISSUER,
        }
        for cert in Certification.objects.filter(character=character).order_by('-issued_at')
    ]

    projects = []
    for sp in character.startup_projects.all():
        projects.append({
            'id': f"startup-{sp.id}",
            'title': sp.name,
            'category': f"Startup ({sp.get_sector_display()})",
            'description': sp.pitch,
            'stage': sp.get_stage_display(),
            'impact': f"{sp.users_count} utilisateurs simulés • {sp.monthly_revenue:,} MGA virtuels/mois",
            'date': sp.created_at.strftime('%d/%m/%Y'),
            'verified': True,
        })
    for hp in character.hackathon_participations.select_related('hackathon'):
        projects.append({
            'id': f"hackathon-{hp.id}",
            'title': f"{hp.team_name} — {hp.hackathon.title}",
            'category': 'Challenge Hackathon',
            'description': hp.submission_pitch,
            'stage': 'Équipe lauréate' if hp.is_winner else 'Solution présentée au jury',
            'impact': f"Note du jury simulé : {hp.score}/100",
            'date': hp.created_at.strftime('%d/%m/%Y'),
            'verified': True,
        })
    for fc in character.freelance_contracts.select_related('gig'):
        projects.append({
            'id': f"freelance-{fc.id}",
            'title': fc.gig.title,
            'category': 'Mission freelance simulée',
            'description': fc.gig.description,
            'stage': 'Mission réalisée',
            'impact': f"Client fictif : {fc.gig.client_name}",
            'date': fc.completed_at.strftime('%d/%m/%Y'),
            'verified': True,
        })

    awarded = {cb.badge_id: cb for cb in character.badges.select_related('badge')}
    badges = [
        {
            'key': b.key,
            'name': b.name,
            'description': b.description,
            'icon': b.icon,
            'unlocked': b.id in awarded,
            'date': awarded[b.id].awarded_at.strftime('%d/%m/%Y') if b.id in awarded else None,
        }
        for b in Badge.objects.order_by('id')
    ]
    if not owner:
        badges = [b for b in badges if b['unlocked']]

    guild_count = 1 if hasattr(character, 'guild_membership') and character.guild_membership else 0
    hackathon_count = character.hackathon_participations.count()
    stats = {
        'projectsDelivered': len(projects),
        'challengesResolved': character.completed_challenges,
        'certificationsCount': len(certifications),
        'collaborativeProjects': hackathon_count + guild_count,
    }

    job_info = None
    if character.current_job:
        job_info = {
            'title': character.current_job.title,
            'company': character.current_job.company,
            'salary': character.current_job.salary,
        }

    payload = {
        'citizenId': f"#YC-{character.id:05d}" if owner else '',
        'citizenName': character.name,
        'title': character.title,
        'level': character.level,
        'xp': character.xp,
        'avatarSeed': character.avatar_seed if owner else '',
        'verificationCode': character.passport_code or '',
        'issuedAt': timezone.localdate().strftime('%d/%m/%Y'),
        'authority': AUTHORITY,
        'aptitudeScore': aptitude_score if visible('skills') else 0,
        'currentJob': job_info,
        'stats': stats if visible('stats') else {
            'projectsDelivered': 0, 'challengesResolved': 0, 'certificationsCount': 0, 'collaborativeProjects': 0,
        },
        'skills': skills if visible('skills') else [],
        'certifications': certifications if visible('certifications') else [],
        'projects': projects if visible('projects') else [],
        'badges': badges if visible('badges') else [],
    }
    payload['cryptographicSignature'] = _sign(payload)
    payload['publicShareUrl'] = f"/passport/{character.passport_code}" if character.passport_public and character.passport_code else ''
    payload['isVerified'] = bool(character.passport_public)
    payload['isPublic'] = bool(character.passport_public)
    payload['shareCode'] = character.passport_code or '' if owner else ''
    payload['sections'] = sections if owner else {}
    payload['hiddenSections'] = [] if owner else [name for name, shown in sections.items() if not shown]
    return payload


@document('Passeport', 'Career Passport du citoyen')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_career_passport(request):
    """Vue complète du passeport pour son propriétaire, avec l'état de publication."""
    character = get_active_character(request)
    return Response({'success': True, 'passport': generate_career_passport_data(character, owner=True)})


@document('Passeport', 'Publier ou retirer son Career Passport')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_passport_publication(request):
    """
    Le joueur décide si son passeport est public et quelles sections le sont (§22.1).
    Publier génère un code aléatoire ; retirer le supprime, ce qui invalide tous les anciens liens.
    """
    character = get_active_character(request)
    wants_public = request.data.get('public')
    if not isinstance(wants_public, bool):
        return Response({'error': "Le champ « public » doit être vrai ou faux."}, status=status.HTTP_400_BAD_REQUEST)

    sections = request.data.get('sections')
    if sections is not None:
        if not isinstance(sections, dict) or any(
            key not in policy.PASSPORT_SECTIONS or not isinstance(value, bool) for key, value in sections.items()
        ):
            return Response(
                {'error': f"Sections invalides. Sections possibles : {', '.join(policy.PASSPORT_SECTIONS)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if wants_public and character.birth_year is None:
        return Response(
            {'error': "Déclare d'abord ton année de naissance avant de publier ton passeport."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if sections is not None:
        merged = passport_sections(character)
        merged.update(sections)
        character.passport_sections = merged

    if wants_public:
        if not character.passport_code:
            character.passport_code = f"YC-{secrets.token_urlsafe(9)}"
        character.passport_public = True
    else:
        character.passport_public = False
        character.passport_code = None
    character.save(update_fields=['passport_sections', 'passport_public', 'passport_code'])

    return Response({
        'success': True,
        'message': "Passeport publié." if wants_public else "Passeport retiré : les anciens liens ne fonctionnent plus.",
        'passport': generate_career_passport_data(character, owner=True),
    })


@document('Passeport', 'Vérifier publiquement un Career Passport')
@api_view(['GET'])
@permission_classes([AllowAny])
@throttle_classes([PassportVerifyRateThrottle])
def verify_career_passport(request, code):
    """
    Lecture publique d'un passeport publié, par son code aléatoire uniquement (jamais par identifiant citoyen).
    Seules les sections choisies par le joueur sont renvoyées ; un code inconnu ou retiré donne la même 404.
    """
    clean_code = sanitize_short_identifier(code, max_length=64)
    character = None
    if clean_code:
        character = Character.objects.filter(passport_code=clean_code, passport_public=True).first()
    if not character:
        return Response({'success': False, 'error': 'Passeport introuvable ou non publié.'}, status=status.HTTP_404_NOT_FOUND)
    data = generate_career_passport_data(character, owner=False)
    return Response({
        'success': True,
        'verified': True,
        'verificationCode': character.passport_code,
        'signature': data['cryptographicSignature'],
        'passport': data,
    })
