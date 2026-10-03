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
    """Aléas et dilemmes éthiques & financiers (Section 25)"""
    key = models.CharField(max_length=64, unique=True)
    title = models.CharField(max_length=160)
    scenario = models.TextField()
    icon = models.CharField(max_length=64, default="AlertTriangle")
    options = models.JSONField(default=list, help_text="Liste des choix possibles avec coûts, gains et conséquences")

    def __str__(self):
        return self.title
