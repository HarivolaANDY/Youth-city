"""Constantes, archétypes et helpers partagés par tous les modules de vues."""


from rest_framework.exceptions import NotAuthenticated

from game.models import (
    Property,
    Skill,
    Character,
    CharacterSkill,
    Transaction,
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
    CharacterSkill.objects.bulk_create([
        CharacterSkill(
            character=char,
            skill=skill,
            level_percent=20 if skill.key in ['budget', 'communication'] else 10
        )
        for skill in Skill.objects.all()
    ])
    return char


def get_active_character(request):
    """Retourne le personnage du compte authentifié. Aucun personnage partagé : sans compte, 401."""
    user = request.user
    if not (user and user.is_authenticated):
        raise NotAuthenticated()
    base_qs = Character.objects.select_related('current_housing', 'current_job')
    char = base_qs.filter(user=user).first()
    if not char:
        char = create_initial_character_for_user(user)
        char = base_qs.filter(id=char.id).first() or char
    return char


def game_timestamp(character):
    """Horodatage de jeu lisible : « J-12 Matin »."""
    slot = character.time_slot.split(' ')[0] if character.time_slot else 'Matin'
    return f"J-{character.day} {slot}"


def record_transaction(character, *, label, amount, transaction_type, category, money_before):
    """
    Enregistre une transaction auditable (§10.3, §29) avec le solde courant avant/après.
    À appeler APRÈS avoir modifié `character.money` en mémoire ; `money_before` est le solde capturé avant.
    """
    return Transaction.objects.create(
        character=character,
        timestamp=game_timestamp(character),
        label=label,
        amount=amount,
        transaction_type=transaction_type,
        category=category,
        balance_before=money_before,
        balance_after=character.money,
    )


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
    rent_label = f"Loyer mensuel — {housing_name}"

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
        before = character.money
        character.money -= rent_price
        summary['rentPaid'] = rent_price
        summary['status'] = 'paid'
        summary['messages'].append(f"🏠 Loyer mensuel prélevé : -{rent_price:,} MGA ({housing_name}).")
        record_transaction(
            character, label=rent_label, amount=-rent_price,
            transaction_type='expense', category='Logement', money_before=before,
        )
    elif character.money + character.savings >= rent_price:
        shortfall = rent_price - character.money
        summary['rentPaid'] = character.money
        summary['rentCoveredBySavings'] = shortfall
        summary['status'] = 'covered_by_savings'
        summary['messages'].append(
            f"⚠️ Solde insuffisant : {shortfall:,} MGA prélevés sur ton épargne BOA pour honorer ton loyer ({housing_name})."
        )
        # a) l'épargne alimente le compte courant ...
        before = character.money
        character.savings -= shortfall
        character.money += shortfall
        record_transaction(
            character, label="Puisement épargne BOA pour loyer", amount=shortfall,
            transaction_type='savings_out', category='Épargne', money_before=before,
        )
        # b) ... puis le loyer est prélevé
        before = character.money
        character.money -= rent_price
        record_transaction(
            character, label=rent_label, amount=-rent_price,
            transaction_type='expense', category='Logement', money_before=before,
        )
    else:
        before = character.money
        paid = character.money + character.savings
        unpaid = rent_price - paid
        summary['rentPaid'] = paid
        summary['rentUnpaid'] = unpaid
        summary['status'] = 'overdue'
        character.money = 0
        character.savings = 0
        character.wellbeing = max(10, character.wellbeing - 20)
        summary['messages'].append(
            f"🚨 Impayé de loyer ! Manque de {unpaid:,} MGA pour {housing_name}. Stress financier : -20% bien-être."
        )
        record_transaction(
            character, label=f"{rent_label} (Impayé partiel)", amount=-paid,
            transaction_type='expense', category='Logement', money_before=before,
        )

    # 2. Intérêts du livret d'épargne BOA (1% mensuel sur l'épargne conservée)
    if character.savings > 0:
        interest = round(character.savings * 0.01)
        if interest > 0:
            character.savings += interest
            summary['interestEarned'] = interest
            summary['messages'].append(f"🏦 Épargne récompensée : +{interest:,} MGA d'intérêts versés sur ton livret BOA !")
            record_transaction(
                character, label="Intérêts mensuels livret d'épargne BOA", amount=interest,
                transaction_type='savings_in', category='Épargne', money_before=character.money,
            )

    # 3. Prime mensuelle de fidélité professionnelle (si emploi actif)
    if character.current_job:
        job_bonus = round(character.current_job.salary * 0.10)
        if job_bonus > 0:
            before = character.money
            character.money += job_bonus
            summary['salaryBonusEarned'] = job_bonus
            summary['messages'].append(
                f"💼 Prime de fidélité professionnelle : +{job_bonus:,} MGA perçus ({character.current_job.company})."
            )
            record_transaction(
                character, label=f"Prime mensuelle — {character.current_job.title}", amount=job_bonus,
                transaction_type='income', category='Salaire', money_before=before,
            )

    return summary
