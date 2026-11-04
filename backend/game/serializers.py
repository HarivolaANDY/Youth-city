from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from game import policy
from game.models import (
    Property,
    Skill,
    Job,
    Course,
    Character,
    Transaction,
    Dilemma,
    MarketItem,
    StartupProject,
    Guild,
    Hackathon,
    HackathonParticipation,
    ModerationReport,
    FreelanceGig,
    FreelanceContract,
    CitizenMessage,
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
    birthYear = serializers.IntegerField()
    acceptTerms = serializers.BooleanField()
    guardianConsent = serializers.BooleanField(required=False, default=False)

    def validate_birthYear(self, value):
        error = policy.validate_birth_year(value)
        if error:
            raise serializers.ValidationError(error)
        return value

    def validate_acceptTerms(self, value):
        if not value:
            raise serializers.ValidationError("L'acceptation des conditions d'utilisation est obligatoire.")
        return value

    def validate(self, attrs):
        if policy.age_group_for_birth_year(attrs['birthYear']) == 'minor' and not attrs.get('guardianConsent'):
            raise serializers.ValidationError({
                'guardianConsent': "Un accord du représentant légal est requis pour les moins de 18 ans.",
            })
        return attrs

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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Le barème de l'entretien reste côté serveur : le client ne voit que le texte des réponses.
        data['sampleAnswers'] = [
            {k: v for k, v in answer.items() if k not in ('score', 'feedback')}
            for answer in (data.get('sampleAnswers') or [])
        ]
        return data


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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # La bonne réponse des quiz reste côté serveur (§10.3) : elle n'est révélée qu'après validation.
        cleaned = []
        for module in (data.get('modules') or []):
            module = dict(module)
            quiz = module.get('quiz')
            if isinstance(quiz, dict):
                module['quiz'] = {k: v for k, v in quiz.items() if k not in ('correctIndex', 'explanation')}
            cleaned.append(module)
        data['modules'] = cleaned
        return data


class DilemmaSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='key')

    class Meta:
        model = Dilemma
        fields = ['id', 'title', 'category', 'scenario', 'icon', 'options']


class TransactionSerializer(serializers.ModelSerializer):
    type = serializers.CharField(source='transaction_type')
    balanceBefore = serializers.IntegerField(source='balance_before', read_only=True, allow_null=True)
    balanceAfter = serializers.IntegerField(source='balance_after', read_only=True, allow_null=True)

    class Meta:
        model = Transaction
        fields = ['id', 'timestamp', 'label', 'amount', 'type', 'category', 'balanceBefore', 'balanceAfter']


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

    @extend_schema_field(bool)
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
    badges = serializers.SerializerMethodField()
    onboardingCompleted = serializers.BooleanField(source='onboarding_completed', read_only=True)
    ageGroup = serializers.SerializerMethodField()
    needsAgeDeclaration = serializers.SerializerMethodField()
    privacy = serializers.SerializerMethodField()
    workedToday = serializers.SerializerMethodField()

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
            'badges',
            'onboardingCompleted',
            'ageGroup',
            'needsAgeDeclaration',
            'privacy',
            'workedToday',
        ]

    @extend_schema_field(str)
    def get_ageGroup(self, obj):
        return obj.age_group

    @extend_schema_field(bool)
    def get_needsAgeDeclaration(self, obj):
        return obj.user_id is not None and obj.birth_year is None

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_privacy(self, obj):
        return {'showInDirectory': obj.show_in_directory, 'showInLeaderboard': obj.show_in_leaderboard}

    @extend_schema_field(bool)
    def get_workedToday(self, obj):
        return obj.last_shift_day == obj.day

    def get_badges(self, obj):
        return [
            {
                'key': cb.badge.key,
                'name': cb.badge.name,
                'description': cb.badge.description,
                'icon': cb.badge.icon,
                'awardedAt': cb.awarded_at.isoformat(),
            }
            for cb in obj.badges.select_related('badge')
        ]

    def get_currentHousingId(self, obj):
        return obj.current_housing.key if obj.current_housing else 'housing-studio'

    def get_currentJobId(self, obj):
        return obj.current_job.key if obj.current_job else None

    def get_skills(self, obj):
        return dict(obj.skills.values_list('skill__key', 'level_percent'))

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

    @extend_schema_field(bool)
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

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_myParticipation(self, obj):
        my_parts = self.context.get('my_participations')
        if my_parts is not None:
            return my_parts.get(obj.id)
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
    resolvedAt = serializers.DateTimeField(source='resolved_at', format='%d/%m/%Y %H:%M', read_only=True)
    resolvedBy = serializers.SerializerMethodField()

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
            'resolvedAt',
            'resolvedBy',
        ]

    @extend_schema_field(str)
    def get_resolvedBy(self, obj):
        return obj.resolved_by.username if obj.resolved_by else None

    @extend_schema_field(str)
    def get_reporterName(self, obj):
        return obj.reporter.name if obj.reporter else "Système Citoyen"


class FreelanceContractSerializer(serializers.ModelSerializer):
    gigKey = serializers.CharField(source='gig.key', read_only=True)
    gigTitle = serializers.CharField(source='gig.title', read_only=True)
    clientName = serializers.CharField(source='gig.client_name', read_only=True)
    category = serializers.CharField(source='gig.category', read_only=True)
    xpEarned = serializers.IntegerField(source='xp_earned', read_only=True)
    completedAt = serializers.DateTimeField(source='completed_at', format='%d/%m/%Y %H:%M', read_only=True)

    class Meta:
        model = FreelanceContract
        fields = [
            'id',
            'gigKey',
            'gigTitle',
            'clientName',
            'category',
            'payout',
            'xpEarned',
            'day',
            'completedAt',
        ]


class FreelanceGigSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source='key')
    clientName = serializers.CharField(source='client_name')
    rewardMoney = serializers.IntegerField(source='reward_money')
    rewardXp = serializers.IntegerField(source='reward_xp')
    energyCost = serializers.IntegerField(source='energy_cost')
    durationHours = serializers.IntegerField(source='duration_hours')
    requiredSkillKey = serializers.CharField(source='required_skill_key')
    requiredSkillName = serializers.CharField(source='required_skill_name')
    minSkillPercent = serializers.IntegerField(source='min_skill_percent')
    canApply = serializers.SerializerMethodField()
    citizenSkillLevel = serializers.SerializerMethodField()
    reason = serializers.SerializerMethodField()
    completedCount = serializers.SerializerMethodField()

    class Meta:
        model = FreelanceGig
        fields = [
            'id',
            'key',
            'title',
            'clientName',
            'category',
            'description',
            'rewardMoney',
            'rewardXp',
            'energyCost',
            'durationHours',
            'requiredSkillKey',
            'requiredSkillName',
            'minSkillPercent',
            'icon',
            'canApply',
            'citizenSkillLevel',
            'reason',
            'completedCount',
        ]

    def _get_skill_level(self, obj):
        character = self.context.get('character')
        if not character:
            return 0
        skills_map = self.context.get('skills_map')
        if skills_map is not None:
            if obj.required_skill_key in skills_map:
                return skills_map[obj.required_skill_key]
            category_map = self.context.get('category_map', {})
            return category_map.get(obj.required_skill_key, 10)
        cs = character.skills.filter(skill__key=obj.required_skill_key).first()
        if not cs:
            cs = character.skills.filter(skill__category=obj.required_skill_key).first()
        return cs.level_percent if cs else 10

    def get_citizenSkillLevel(self, obj):
        return self._get_skill_level(obj)

    def get_canApply(self, obj):
        character = self.context.get('character')
        if not character:
            return False
        skill_ok = self._get_skill_level(obj) >= obj.min_skill_percent
        energy_ok = character.energy >= obj.energy_cost
        return skill_ok and energy_ok

    def get_reason(self, obj):
        character = self.context.get('character')
        if not character:
            return "Session citoyen non trouvée"
        if character.energy < obj.energy_cost:
            return f"Énergie insuffisante ({character.energy}% / {obj.energy_cost}% requis)"
        lvl = self._get_skill_level(obj)
        if lvl < obj.min_skill_percent:
            return f"Compétence insuffisante ({lvl}% / {obj.min_skill_percent}% requis)"
        return ""

    def get_completedCount(self, obj):
        character = self.context.get('character')
        if not character:
            return 0
        contracts_map = self.context.get('contracts_map')
        if contracts_map is not None:
            return contracts_map.get(obj.id, 0)
        return obj.contracts.filter(character=character).count()


class CitizenDirectorySerializer(serializers.ModelSerializer):
    """Profil public dans l'annuaire citoyen (§29)"""
    avatarSeed = serializers.CharField(source='avatar_seed')
    guildName = serializers.SerializerMethodField()
    jobTitle = serializers.SerializerMethodField()
    certificationsCount = serializers.SerializerMethodField()
    unreadMessagesCount = serializers.SerializerMethodField()
    isMe = serializers.SerializerMethodField()
    isSimulated = serializers.SerializerMethodField()

    class Meta:
        model = Character
        fields = [
            'id',
            'name',
            'avatarSeed',
            'title',
            'level',
            'xp',
            'day',
            'guildName',
            'jobTitle',
            'certificationsCount',
            'unreadMessagesCount',
            'isMe',
            'isSimulated',
        ]

    @extend_schema_field(bool)
    def get_isSimulated(self, obj):
        return obj.is_simulated

    @extend_schema_field(str)
    def get_guildName(self, obj):
        if hasattr(obj, 'guild_membership') and obj.guild_membership:
            return obj.guild_membership.guild.name
        return "Sans guilde"

    @extend_schema_field(str)
    def get_jobTitle(self, obj):
        if obj.current_job:
            return obj.current_job.title
        return "En recherche / Freelance"

    @extend_schema_field(int)
    def get_certificationsCount(self, obj):
        # Utilise le cache prefetch_related s'il existe pour éviter une requête SQL par citoyen
        if hasattr(obj, '_prefetched_objects_cache') and 'certifications' in obj._prefetched_objects_cache:
            return len(obj.certifications.all())
        return obj.certifications.count()

    @extend_schema_field(int)
    def get_unreadMessagesCount(self, obj):
        unread_map = self.context.get('unread_counts')
        if unread_map is not None:
            return unread_map.get(obj.id, 0)
        character = self.context.get('character')
        if not character:
            return 0
        return CitizenMessage.objects.filter(sender=obj, recipient=character, is_read=False).count()

    @extend_schema_field(bool)
    def get_isMe(self, obj):
        character = self.context.get('character')
        return bool(character and obj.id == character.id)


class CitizenMessageSerializer(serializers.ModelSerializer):
    """Message direct entre deux citoyens (§29)"""
    senderId = serializers.IntegerField(source='sender.id', read_only=True)
    senderName = serializers.CharField(source='sender.name', read_only=True)
    senderAvatar = serializers.CharField(source='sender.avatar_seed', read_only=True)
    recipientId = serializers.IntegerField(source='recipient.id', read_only=True)
    recipientName = serializers.CharField(source='recipient.name', read_only=True)
    contextTag = serializers.CharField(source='context_tag')
    isRead = serializers.BooleanField(source='is_read')
    createdAt = serializers.DateTimeField(source='created_at', format="%d/%m/%Y %H:%M")
    isFromMe = serializers.SerializerMethodField()
    senderIsSimulated = serializers.SerializerMethodField()

    class Meta:
        model = CitizenMessage
        fields = [
            'id',
            'senderIsSimulated',
            'senderId',
            'senderName',
            'senderAvatar',
            'recipientId',
            'recipientName',
            'content',
            'contextTag',
            'isRead',
            'createdAt',
            'isFromMe',
        ]

    @extend_schema_field(bool)
    def get_isFromMe(self, obj):
        character = self.context.get('character')
        return bool(character and obj.sender_id == character.id)

    @extend_schema_field(bool)
    def get_senderIsSimulated(self, obj):
        return obj.sender.is_simulated
