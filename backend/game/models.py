from django.db import models
from django.contrib.auth.models import User

class Property(models.Model):
    """Logements disponibles au Residential District (Section 9 & 41)"""
    key = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    rent_price = models.IntegerField(help_text="Loyer mensuel en MGA")
    comfort_rate = models.IntegerField(default=3, help_text="Étoiles de confort (1-5)")
    energy_recovery = models.IntegerField(default=50, help_text="Pourcentage de récupération d'énergie par nuit")
    description = models.TextField(blank=True)
    features = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.name} ({self.rent_price:,} MGA/mois)"

    class Meta:
        verbose_name_plural = "Properties"


class Skill(models.Model):
    """Compétences clés : Soft, Hard, Life skills (Section 15 & 41)"""
    CATEGORY_CHOICES = (
        ('hard', 'Hard Skills (Technique)'),
        ('soft', 'Soft Skills (Comportemental)'),
        ('life', 'Life Skills (Vie quotidienne & Budget)'),
    )
    key = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='hard')
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class Job(models.Model):
    """Offres d'emploi au Business District (Section 8 & 21)"""
    key = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=128)
    company = models.CharField(max_length=128)
    salary = models.IntegerField(help_text="Salaire mensuel en MGA")
    energy_per_shift = models.IntegerField(default=20, help_text="Énergie requise par shift")
    min_experience = models.CharField(max_length=128, default="1 projet validé")
    description = models.TextField(blank=True)
    interview_question = models.TextField(default="Pourquoi devrions-nous retenir votre candidature ?")
    requirements = models.JSONField(default=list, blank=True)
    sample_answers = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.title} chez {self.company} ({self.salary:,} MGA/mois)"


class Course(models.Model):
    """Formations dispensées au Campus District (Section 7 & 23)"""
    key = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=160)
    category = models.CharField(max_length=64, default="Tech")
    duration_days = models.IntegerField(default=3)
    cost = models.IntegerField(default=50000, help_text="Coût d'inscription en MGA")
    xp_reward = models.IntegerField(default=150)
    certification_name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    skills_awarded = models.JSONField(default=dict, blank=True)
    modules = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.title} ({self.cost:,} MGA)"


class Character(models.Model):
    """Avatar citoyen (Section 14 & 41)"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='character', null=True, blank=True)
    name = models.CharField(max_length=64, default="Emmanuel")
    avatar_seed = models.CharField(max_length=64, default="Felix")
    title = models.CharField(max_length=128, default="Apprenti Développeur & Citoyen Actif")
    level = models.IntegerField(default=1)
    xp = models.IntegerField(default=0)
    xp_to_next_level = models.IntegerField(default=500)
    energy = models.IntegerField(default=80, help_text="0 à 100%")
    wellbeing = models.IntegerField(default=80, help_text="0 à 100%")
    money = models.BigIntegerField(default=250000, help_text="Solde courant liquide en MGA")
    savings = models.BigIntegerField(default=50000, help_text="Épargne sécurisée en MGA")
    day = models.IntegerField(default=1)
    time_slot = models.CharField(max_length=32, default="Matin (08:00)")
    
    current_objective = models.JSONField(default=dict, blank=True)
    current_housing = models.ForeignKey(Property, on_delete=models.SET_NULL, null=True, blank=True)
    current_job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True)
    
    completed_courses = models.JSONField(default=list, blank=True)
    completed_projects = models.IntegerField(default=0)
    completed_challenges = models.IntegerField(default=0)
    inventory = models.JSONField(default=list, blank=True, help_text="Liste des clés d'équipements possédés")
    active_dilemma_key = models.CharField(max_length=64, blank=True, default="", help_text="Clé du dilemme/aléa en cours de résolution")
    resolved_dilemmas = models.JSONField(default=list, blank=True, help_text="Clés des dilemmes déjà résolus")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} — Niv. {self.level} ({self.money:,} MGA)"


class CharacterSkill(models.Model):
    """Niveau de maîtrise par compétence (0-100%)"""
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)
    level_percent = models.IntegerField(default=10, help_text="Maîtrise en pourcentage (0-100%)")

    class Meta:
        unique_together = ('character', 'skill')

    def __str__(self):
        return f"{self.character.name} - {self.skill.name}: {self.level_percent}%"


class Certification(models.Model):
    """Certifications acquises au Campus (Career Passport Section 35)"""
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='certifications')
    title = models.CharField(max_length=160)
    issued_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.character.name}"


class Transaction(models.Model):
    """Journal des flux financiers en MGA (Section 20)"""
    TYPE_CHOICES = (
        ('income', 'Revenu'),
        ('expense', 'Dépense'),
        ('savings_in', 'Dépôt Épargne'),
        ('savings_out', 'Retrait Épargne'),
    )
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='transactions')
    label = models.CharField(max_length=160)
    amount = models.IntegerField(help_text="Montant en MGA (positif ou négatif)")
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='expense')
    category = models.CharField(max_length=64, default="Général")
    timestamp = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.label}: {self.amount:,} MGA ({self.character.name})"


class Dilemma(models.Model):
    """Aléas et dilemmes éthiques & financiers (Section 25 & 26)"""
    CATEGORY_CHOICES = (
        ('general', 'Aléa Général'),
        ('career', 'Emploi & Carrière'),
        ('finance', 'Finance & Budget'),
        ('domestic', 'Résidentiel & Logement'),
        ('startup', 'Innovation & Entrepreneuriat'),
        ('campus', 'Études & Campus'),
    )
    key = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=160)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='general')
    scenario = models.TextField()
    icon = models.CharField(max_length=64, default="AlertTriangle")
    conditions = models.JSONField(default=dict, blank=True, help_text="Conditions de déclenchement contextuel")
    options = models.JSONField(default=list, help_text="Liste des choix possibles avec coûts, gains et conséquences")

    def __str__(self):
        return f"[{self.get_category_display()}] {self.title}"


class MarketItem(models.Model):
    """Articles du Market District : Alimentation, Équipements, Mobilier & Transport (§11, §19)"""
    CATEGORY_CHOICES = (
        ('food', 'Alimentation & Vitalité'),
        ('equipment', 'Équipement Pro & High-Tech'),
        ('transport', 'Mobilité & Transport'),
        ('lifestyle', 'Confort & Décoration Foyer'),
    )
    key = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='food')
    price = models.IntegerField(help_text="Prix d'achat en MGA")
    energy_bonus = models.IntegerField(default=0, help_text="Gain d'énergie vitale (0-100%)")
    wellbeing_bonus = models.IntegerField(default=0, help_text="Gain de bien-être (0-100%)")
    description = models.TextField(blank=True)
    is_consumable = models.BooleanField(
        default=True,
        help_text="Vrai si consommable immédiatement (nourriture), faux si équipement permanent (inventaire)"
    )
    icon = models.CharField(max_length=64, default="ShoppingBag")

    def __str__(self):
        return f"{self.name} ({self.price:,} MGA) - {self.get_category_display()}"


class StartupProject(models.Model):
    """Projet entrepreneurial et startup au Startup District (§12, §24)"""
    STAGE_CHOICES = (
        ('idea', 'Idée & Étude de Marché'),
        ('mvp', 'Prototypage & MVP'),
        ('launched', 'Lancement & Premiers Clients'),
        ('growth', 'Croissance & Scalabilité'),
    )
    SECTOR_CHOICES = (
        ('tech', 'Tech & Applications Mobiles'),
        ('greentech', 'Impact Écologique & Recyclage'),
        ('agritech', 'AgriTech & Circuits Courts'),
        ('services', 'Services & Commerce Local'),
    )
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='startup_projects')
    key = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=160)
    sector = models.CharField(max_length=32, choices=SECTOR_CHOICES, default='tech')
    pitch = models.TextField(help_text="Proposition de valeur et pitch synthétique")
    stage = models.CharField(max_length=32, choices=STAGE_CHOICES, default='idea')
    progress = models.IntegerField(default=10, help_text="Progression globale de la phase (0-100%)")
    treasury = models.BigIntegerField(default=50000, help_text="Trésorerie de la startup en MGA")
    monthly_revenue = models.BigIntegerField(default=0, help_text="Revenus mensuels récurrents en MGA")
    reputation = models.IntegerField(default=15, help_text="Notoriété et confiance clients (0-100%)")
    users_count = models.IntegerField(default=0, help_text="Nombre de clients ou utilisateurs actifs")
    has_incubator_grant = models.BooleanField(default=False, help_text="A reçu la subvention d'amorçage de l'incubateur")
    team = models.JSONField(default=list, blank=True, help_text="Liste des rôles/associés (ex: Développeur, Commercial)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_stage_display()}) — {self.character.name}"


class Guild(models.Model):
    """Guilde professionnelle et communauté thématique au City Hub (§13, §30)"""
    CATEGORY_CHOICES = (
        ('tech', 'Développeurs & Ingénieurs'),
        ('design', 'Designers & Créatifs UI/UX'),
        ('business', 'Entrepreneurs & Innovateurs'),
        ('finance', 'Finance & Investissement'),
        ('green', 'Impact Social & Écologie'),
    )
    key = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=160)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='tech')
    description = models.TextField()
    motto = models.CharField(max_length=255, blank=True)
    icon = models.CharField(max_length=64, default="Users")
    member_count = models.IntegerField(default=12)
    xp_bonus_percent = models.IntegerField(default=5, help_text="Bonus de gain d'XP pour les membres actifs (%)")
    badge_reward = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class GuildMembership(models.Model):
    """Adhésion d'un citoyen à une guilde thématique (§30)"""
    character = models.OneToOneField(Character, on_delete=models.CASCADE, related_name='guild_membership')
    guild = models.ForeignKey(Guild, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=32, default='member')
    contributed_xp = models.IntegerField(default=0)
    joined_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.character.name} in {self.guild.name} ({self.role})"


class Hackathon(models.Model):
    """Challenge collaboratif et hackathon inter-quartiers au City Hub (§13, §31)"""
    STATUS_CHOICES = (
        ('open', 'Inscriptions Ouvertes'),
        ('in_progress', 'En Cours'),
        ('completed', 'Terminé'),
    )
    key = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=160)
    theme = models.CharField(max_length=120)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='open')
    team_size = models.IntegerField(default=3, help_text="Taille recommandée d'équipe (3 à 5)")
    duration_hours = models.IntegerField(default=48)
    xp_pool = models.IntegerField(default=3000, help_text="Pool d'XP à remporter")
    prize_money = models.BigIntegerField(default=300000, help_text="Prix en MGA virtuels pour l'équipe")
    description = models.TextField()
    evaluation_criteria = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.theme}) - {self.get_status_display()}"


class HackathonParticipation(models.Model):
    """Participation et rendu d'une équipe de citoyens à un hackathon (§13, §31)"""
    hackathon = models.ForeignKey(Hackathon, on_delete=models.CASCADE, related_name='participations')
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='hackathon_participations')
    team_name = models.CharField(max_length=120)
    team_members = models.JSONField(default=list)
    submission_pitch = models.TextField()
    score = models.IntegerField(default=0)
    awarded_xp = models.IntegerField(default=0)
    awarded_money = models.BigIntegerField(default=0)
    is_winner = models.BooleanField(default=False)
    feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.team_name} — {self.hackathon.title} (Score: {self.score}/100)"


class ModerationReport(models.Model):
    """Signalement et modération citoyenne pour un environnement bienveillant (§43)"""
    STATUS_CHOICES = (
        ('pending', 'En attente'),
        ('investigating', 'En cours d\'examen'),
        ('resolved', 'Traité / Résolu'),
        ('dismissed', 'Rejeté / Sans suite'),
    )
    REASON_CHOICES = (
        ('harassment', 'Harcèlement ou propos haineux'),
        ('spam', 'Spam ou publicité non autorisée'),
        ('inappropriate', 'Contenu inapproprié ou vulgaire'),
        ('fraud', 'Triche ou fraude économique simulée'),
        ('other', 'Autre signalement éthique'),
    )
    ACTION_CHOICES = (
        ('none', 'Aucune action'),
        ('warning', 'Avertissement officiel'),
        ('quarantine', 'Mise en quarantaine du contenu'),
        ('ban', 'Suspension du compte citoyen'),
    )
    reporter = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='filed_reports', null=True, blank=True)
    target_type = models.CharField(max_length=64, default='message')
    target_id = models.CharField(max_length=128, default='general')
    target_name = models.CharField(max_length=160, blank=True)
    reason = models.CharField(max_length=32, choices=REASON_CHOICES, default='spam')
    details = models.TextField(help_text="Précisions apportées par le signalant")
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='pending')
    action_taken = models.CharField(max_length=32, choices=ACTION_CHOICES, default='none')
    moderator_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report #{self.id} [{self.get_reason_display()}] - {self.get_status_display()}"


class FreelanceGig(models.Model):
    """Missions Freelance & Petits Contrats au Business District (§52)"""
    CATEGORY_CHOICES = (
        ('tech', 'Tech & Développement Web'),
        ('marketing', 'Communication & Marketing'),
        ('finance', 'Gestion, Compta & Finance'),
        ('design', 'Design & Création Visuelle'),
        ('writing', 'Rédaction & Traduction'),
    )
    key = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=160)
    client_name = models.CharField(max_length=128)
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='tech')
    description = models.TextField()
    reward_money = models.IntegerField(help_text="Rémunération nette en MGA")
    reward_xp = models.IntegerField(default=120)
    energy_cost = models.IntegerField(default=25, help_text="Énergie vitale requise (0-100%)")
    duration_hours = models.IntegerField(default=4, help_text="Durée estimée de la prestation en heures")
    required_skill_key = models.CharField(max_length=64, default="hard", help_text="Clé ou catégorie de compétence requise")
    required_skill_name = models.CharField(max_length=128, default="Informatique & Tech")
    min_skill_percent = models.IntegerField(default=20, help_text="Niveau minimum requis en pourcentage (0-100%)")
    icon = models.CharField(max_length=64, default="Briefcase")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.client_name}) — {self.reward_money:,} MGA"


class FreelanceContract(models.Model):
    """Contrat freelance exécuté par un citoyen (§52)"""
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='freelance_contracts')
    gig = models.ForeignKey(FreelanceGig, on_delete=models.CASCADE, related_name='contracts')
    payout = models.BigIntegerField(help_text="Rémunération perçue en MGA")
    xp_earned = models.IntegerField(default=0)
    completed_at = models.DateTimeField(auto_now_add=True)
    day = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.character.name} - {self.gig.title} (+{self.payout:,} MGA)"


class CitizenMessage(models.Model):
    """Messagerie sociale directe entre citoyens au City Hub (§29)"""
    CONTEXT_CHOICES = (
        ('collaboration', 'Collaboration & Projet'),
        ('mentoring', 'Entraide & Mentorat'),
        ('guild', 'Échange de Guilde'),
        ('general', 'Discussion Citoyenne'),
    )
    sender = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='sent_messages')
    recipient = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='received_messages')
    content = models.TextField(help_text="Contenu du message direct")
    context_tag = models.CharField(max_length=32, choices=CONTEXT_CHOICES, default='collaboration')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg {self.sender.name} -> {self.recipient.name}: {self.content[:30]}"




