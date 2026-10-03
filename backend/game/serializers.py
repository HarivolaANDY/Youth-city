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
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined']


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
