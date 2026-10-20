from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from game.models import (
    Property,
    Skill,
    Job,
    Course,
    Character,
    CharacterSkill,
    Certification,
    Transaction,
    Dilemma,
    MarketItem,
    StartupProject,
    Guild,
    GuildMembership,
    Hackathon,
    HackathonParticipation,
    ModerationReport,
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'is_superuser', 'date_joined']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=6)
    citizenName = serializers.CharField(required=False, allow_blank=True, max_length=64)

    def validate_username(self, value):
        val = value.strip()
        if not val:
            raise serializers.ValidationError("Le nom d'utilisateur est requis.")
        if User.objects.filter(username__iexact=val).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur est déjà utilisé.")
        return val

    def validate_password(self, value):
        validate_password(value)
        return value


class CharacterCustomizeSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=64, required=True)
    avatarSeed = serializers.CharField(max_length=64, required=False, default='felix')
    archetype = serializers.ChoiceField(
        choices=[
            ('ambitious_student', 'Étudiant Ambitieux'),
            ('resourceful_self_taught', 'Autodidacte Débrouillard'),
            ('pragmatic_saver', 'Pragmatique Économe'),
        ],
        default='ambitious_student',
    )
    vocation = serializers.ChoiceField(
        choices=[
            ('tech', 'Tech & Développement Web'),
            ('finance', 'Finance & Gestion de Trésorerie'),
            ('business', 'Business, Vente & Entrepreneuriat'),
        ],
        default='tech',
    )

    def validate_name(self, value):
        val = value.strip()
        if len(val) < 2:
            raise serializers.ValidationError("Le prénom doit comporter au moins 2 caractères.")
        return val


class PropertySerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='key')
    title = serializers.CharField(source='name')
    rentMonthly = serializers.IntegerField(source='rent_price')
    comfortStars = serializers.IntegerField(source='comfort_rate')
    energyRecoveryPerNight = serializers.IntegerField(source='energy_recovery')

    class Meta:
        model = Property
        fields = [
            'id',
            'title',
            'rentMonthly',
            'comfortStars',
            'energyRecoveryPerNight',
            'description',
            'features',
        ]


class SkillSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='key')

    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'description']


class JobSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='key')
    salary = serializers.IntegerField()
    energyPerShift = serializers.IntegerField(source='energy_per_shift')
    minExperience = serializers.CharField(source='min_experience')
    interviewQuestion = serializers.CharField(source='interview_question')
    sampleAnswers = serializers.JSONField(source='sample_answers')

    class Meta:
        model = Job
        fields = [
            'id',
            'title',
            'company',
            'salary',
            'energyPerShift',
            'minExperience',
            'description',
            'interviewQuestion',
            'requirements',
            'sampleAnswers',
        ]


class CourseSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='key')
    durationDays = serializers.IntegerField(source='duration_days')
    xpReward = serializers.IntegerField(source='xp_reward')
    skillsAwarded = serializers.JSONField(source='skills_awarded')
    certificationName = serializers.CharField(source='certification_name')

    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'category',
            'durationDays',
            'cost',
            'xpReward',
            'skillsAwarded',
            'description',
            'certificationName',
            'modules',
        ]


class DilemmaSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='key')

    class Meta:
        model = Dilemma
        fields = ['id', 'title', 'scenario', 'icon', 'options']


class TransactionSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='transaction_type')

    class Meta:
        model = Transaction
        fields = ['id', 'timestamp', 'label', 'amount', 'type', 'category']


class MarketItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='key')
    energyBonus = serializers.IntegerField(source='energy_bonus')
    wellbeingBonus = serializers.IntegerField(source='wellbeing_bonus')
    isConsumable = serializers.BooleanField(source='is_consumable')
    isOwned = serializers.SerializerMethodField()

    class Meta:
        model = MarketItem
        fields = [
            'id',
            'name',
            'category',
            'price',
            'energyBonus',
            'wellbeingBonus',
            'description',
            'isConsumable',
            'icon',
            'isOwned',
        ]

    def get_isOwned(self, obj):
        char = self.context.get('character')
        if not char or not char.inventory:
            return False
        return obj.key in char.inventory


class CitizenDetailSerializer(serializers.ModelSerializer):
    """Formats character into the exact Citizen schema consumed by the frontend"""
    avatarSeed = serializers.CharField(source='avatar_seed')
    xpToNextLevel = serializers.IntegerField(source='xp_to_next_level')
    currentHousingId = serializers.SerializerMethodField()
    currentJobId = serializers.SerializerMethodField()
    currentObjective = serializers.JSONField(source='current_objective')
    completedCourses = serializers.JSONField(source='completed_courses')
    completedProjects = serializers.IntegerField(source='completed_projects')
    completedChallenges = serializers.IntegerField(source='completed_challenges')
    skills = serializers.SerializerMethodField()
    certifications = serializers.SerializerMethodField()

    class Meta:
        model = Character
        fields = [
            'id',
            'name',
            'avatarSeed',
            'title',
            'level',
            'xp',
            'xpToNextLevel',
            'energy',
            'wellbeing',
            'money',
            'savings',
            'currentObjective',
            'currentHousingId',
            'currentJobId',
            'skills',
            'completedCourses',
            'certifications',
            'completedProjects',
            'completedChallenges',
            'inventory',
        ]

    def get_currentHousingId(self, obj):
        return obj.current_housing.key if obj.current_housing else 'housing-studio'

    def get_currentJobId(self, obj):
        return obj.current_job.key if obj.current_job else None

    def get_skills(self, obj):
        result = {}
        for cs in obj.skills.select_related('skill'):
            result[cs.skill.key] = cs.level_percent
        return result

    def get_certifications(self, obj):
        return list(obj.certifications.values_list('title', flat=True))


class StartupProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='key')
    monthlyRevenue = serializers.IntegerField(source='monthly_revenue')
    usersCount = serializers.IntegerField(source='users_count')
    hasIncubatorGrant = serializers.BooleanField(source='has_incubator_grant')

    class Meta:
        model = StartupProject
        fields = [
            'id',
            'key',
            'name',
            'sector',
            'pitch',
            'stage',
            'progress',
            'treasury',
            'monthlyRevenue',
            'reputation',
            'usersCount',
            'hasIncubatorGrant',
            'team',
            'created_at',
        ]


class GuildSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='key')
    key = serializers.CharField()
    memberCount = serializers.IntegerField(source='member_count')
    xpBonusPercent = serializers.IntegerField(source='xp_bonus_percent')
    badgeReward = serializers.CharField(source='badge_reward')
    isJoined = serializers.SerializerMethodField()

    class Meta:
        model = Guild
        fields = [
            'id',
            'key',
            'name',
            'category',
            'description',
            'motto',
            'icon',
            'memberCount',
            'xpBonusPercent',
            'badgeReward',
            'isJoined',
        ]

    def get_isJoined(self, obj):
        character = self.context.get('character')
        if not character:
            return False
        return hasattr(character, 'guild_membership') and character.guild_membership.guild_id == obj.id


class HackathonParticipationSerializer(serializers.ModelSerializer):
    teamName = serializers.CharField(source='team_name')
    teamMembers = serializers.JSONField(source='team_members')
    submissionPitch = serializers.CharField(source='submission_pitch')
    awardedXp = serializers.IntegerField(source='awarded_xp')
    awardedMoney = serializers.IntegerField(source='awarded_money')
    isWinner = serializers.BooleanField(source='is_winner')

    class Meta:
        model = HackathonParticipation
        fields = [
            'id',
            'teamName',
            'teamMembers',
            'submissionPitch',
            'score',
            'awardedXp',
            'awardedMoney',
            'isWinner',
            'feedback',
            'created_at',
        ]


class HackathonSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='key')
    key = serializers.CharField()
    teamSize = serializers.IntegerField(source='team_size')
    durationHours = serializers.IntegerField(source='duration_hours')
    xpPool = serializers.IntegerField(source='xp_pool')
    prizeMoney = serializers.IntegerField(source='prize_money')
    evaluationCriteria = serializers.JSONField(source='evaluation_criteria')
    myParticipation = serializers.SerializerMethodField()

    class Meta:
        model = Hackathon
        fields = [
            'id',
            'key',
            'title',
            'theme',
            'status',
            'teamSize',
            'durationHours',
            'xpPool',
            'prizeMoney',
            'description',
            'evaluationCriteria',
            'myParticipation',
        ]

    def get_myParticipation(self, obj):
        character = self.context.get('character')
        if not character:
            return None
        part = obj.participations.filter(character=character).first()
        if not part:
            return None
        return HackathonParticipationSerializer(part).data


class ModerationReportSerializer(serializers.ModelSerializer):
    reporterName = serializers.SerializerMethodField()
    targetType = serializers.CharField(source='target_type')
    targetId = serializers.CharField(source='target_id')
    targetName = serializers.CharField(source='target_name')
    actionTaken = serializers.CharField(source='action_taken')
    moderatorNotes = serializers.CharField(source='moderator_notes')
    createdAt = serializers.DateTimeField(source='created_at', format='%d/%m/%Y %H:%M', read_only=True)

    class Meta:
        model = ModerationReport
        fields = [
            'id',
            'reporterName',
            'targetType',
            'targetId',
            'targetName',
            'reason',
            'details',
            'status',
            'actionTaken',
            'moderatorNotes',
            'createdAt',
        ]

    def get_reporterName(self, obj):
        return obj.reporter.name if obj.reporter else "Système Citoyen"

