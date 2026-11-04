"""Règles de protection des mineurs et de confidentialité (cahier §19.2, §31.1).

Principes :
- on ne stocke que l'année de naissance (donnée minimale) ;
- un âge inconnu est traité comme mineur (principe de précaution) ;
- les mineurs et les adultes ne s'écrivent pas directement et ne se voient pas dans l'annuaire/classements ;
- les citoyens simulés (pairs fictifs du jeu) sont exclus de ces règles : ils n'ont pas d'humain derrière.

Les seuils ci-dessous sont des choix de produit à faire valider par la revue juridique prévue au §31.1.
"""
from django.db.models import Q
from django.utils import timezone

MIN_AGE = 13      # âge minimal d'inscription (le public cible est 15-30 ans, §3.1)
ADULT_AGE = 18
MAX_AGE = 100     # borne de cohérence de la saisie

PASSPORT_SECTIONS = ('skills', 'certifications', 'projects', 'badges', 'stats')


def age_for_birth_year(birth_year):
    return timezone.now().year - birth_year


def age_group_for_birth_year(birth_year):
    """'minor' | 'adult' | 'unknown'."""
    if birth_year is None:
        return 'unknown'
    return 'adult' if age_for_birth_year(birth_year) >= ADULT_AGE else 'minor'


def validate_birth_year(birth_year):
    """Retourne un message d'erreur, ou None si l'année déclarée est acceptable."""
    if isinstance(birth_year, bool) or not isinstance(birth_year, int):
        return "L'année de naissance doit être un nombre."
    age = age_for_birth_year(birth_year)
    if age < 0 or age > MAX_AGE:
        return "L'année de naissance est invalide."
    if age < MIN_AGE:
        return f"Youth City est réservé aux personnes de {MIN_AGE} ans et plus."
    return None


def bracket_q(bracket, prefix=''):
    """Filtre ORM d'une tranche de protection ('adult' ou 'minor'; l'âge inconnu appartient à 'minor')."""
    threshold = timezone.now().year - ADULT_AGE
    field = f'{prefix}birth_year'
    adult = Q(**{f'{field}__lte': threshold})
    if bracket == 'adult':
        return adult
    return Q(**{f'{field}__isnull': True}) | Q(**{f'{field}__gt': threshold})


def blocked_ids(character):
    """Identifiants des citoyens bloqués par `character` ou qui l'ont bloqué."""
    from game.models import UserBlock
    pairs = UserBlock.objects.filter(Q(blocker=character) | Q(blocked=character)).values_list('blocker_id', 'blocked_id')
    ids = set()
    for blocker_id, blocked_id in pairs:
        ids.add(blocked_id if blocker_id == character.id else blocker_id)
    return ids


def can_message(sender, recipient):
    """(autorisé, raison_du_refus). Appliqué côté serveur à chaque message direct."""
    if sender.id == recipient.id:
        return False, "Impossible d'envoyer un message à soi-même."
    if recipient.id in blocked_ids(sender):
        return False, "Échange impossible : l'un de vous a bloqué l'autre."
    if sender.is_simulated or recipient.is_simulated:
        return True, ''
    if sender.protection_bracket != recipient.protection_bracket:
        return False, "Les échanges directs entre mineurs et adultes ne sont pas autorisés sur Youth City."
    return True, ''


def visible_citizens(viewer, queryset, flag_field):
    """
    Citoyens que `viewer` peut voir (annuaire / classement) : lui-même, et les citoyens réels de la même
    tranche de protection qui ont choisi d'être visibles. Les citoyens bloqués (dans un sens ou dans
    l'autre) sont exclus. Les citoyens simulés sont ajoutés par l'appelant lorsqu'ils sont pertinents.
    """
    visible = Q(id=viewer.id) | (Q(user__isnull=False) & Q(**{flag_field: True}) & bracket_q(viewer.protection_bracket))
    return queryset.filter(visible).exclude(id__in=blocked_ids(viewer))
