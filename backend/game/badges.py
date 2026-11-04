"""Badges (§8.3) : chaque badge correspond à une règle explicite, évaluée côté serveur.

Les définitions (nom, description, icône) sont seedées en base ; la règle d'attribution est ici,
indexée par la clé du badge. `award_badges` est idempotent et peut être appelé après toute action.
Les clés reprennent celles déjà utilisées par le Career Passport et le frontend.
"""
from game.models import (
    Badge,
    CharacterBadge,
    GuildMembership,
    HackathonParticipation,
    StartupProject,
)

SMART_SAVER_THRESHOLD = 100_000
SCHOLAR_COURSES_REQUIRED = 3
STREAK_DAYS = 30

BADGE_DEFINITIONS = [
    {"key": "first_job", "name": "First Job", "icon": "Briefcase",
     "description": "Réussir un entretien et décrocher son premier poste au Business District."},
    {"key": "smart_saver", "name": "Smart Saver", "icon": "PiggyBank",
     "description": "Constituer 100 000 MGA d'épargne de sécurité (BOA)."},
    {"key": "scholar", "name": "Scholar", "icon": "GraduationCap",
     "description": f"Terminer {SCHOLAR_COURSES_REQUIRED} formations du Campus District."},
    {"key": "team_player", "name": "Team Player", "icon": "Users",
     "description": "Participer à un hackathon du City Hub."},
    {"key": "serial_entrepreneur", "name": "Entrepreneur", "icon": "Rocket",
     "description": "Lancer un premier projet au Startup District."},
    {"key": "developer", "name": "Developer", "icon": "Code",
     "description": "Valider la formation Développement Web."},
    {"key": "community_builder", "name": "Community Builder", "icon": "Heart",
     "description": "Rejoindre une guilde du City Hub."},
    {"key": "streak_30", "name": "30 Days In", "icon": "Flame",
     "description": f"Atteindre le jour {STREAK_DAYS} de ta partie."},
]


def _first_job(character):
    return bool(character.passed_interviews) or character.current_job_id is not None


def _smart_saver(character):
    return character.savings >= SMART_SAVER_THRESHOLD


def _scholar(character):
    return len(character.completed_courses or []) >= SCHOLAR_COURSES_REQUIRED


def _team_player(character):
    return HackathonParticipation.objects.filter(character=character).exists()


def _serial_entrepreneur(character):
    return StartupProject.objects.filter(character=character).exists()


def _developer(character):
    return 'course-web-dev' in (character.completed_courses or [])


def _community_builder(character):
    return GuildMembership.objects.filter(character=character).exists()


def _streak_30(character):
    return character.day >= STREAK_DAYS


BADGE_RULES = {
    "first_job": _first_job,
    "smart_saver": _smart_saver,
    "scholar": _scholar,
    "team_player": _team_player,
    "serial_entrepreneur": _serial_entrepreneur,
    "developer": _developer,
    "community_builder": _community_builder,
    "streak_30": _streak_30,
}


def award_badges(character):
    """Attribue les badges dont la règle est remplie. Retourne la liste des badges nouvellement obtenus."""
    owned = set(
        CharacterBadge.objects.filter(character=character).values_list('badge__key', flat=True)
    )
    pending = [key for key in BADGE_RULES if key not in owned]
    if not pending:
        return []

    badges_by_key = {b.key: b for b in Badge.objects.filter(key__in=pending)}
    awarded = []
    for key in pending:
        badge = badges_by_key.get(key)
        if badge is not None and BADGE_RULES[key](character):
            _, created = CharacterBadge.objects.get_or_create(character=character, badge=badge)
            if created:
                awarded.append(badge)
    return awarded
