"""Campus District : formations, inscription payante et quiz de validation."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction
from django.utils import timezone


from game.models import (
    Skill,
    Course,
    Character,
    CharacterSkill,
    Certification,
    CourseEnrollment,
)
from game.serializers import (
    CourseSerializer,
    CitizenDetailSerializer,
    TransactionSerializer,
)
from game.badges import award_badges

from game.api_docs import (
    document,
    QuizAnswerRequest,
)
from game.views.common import add_xp_to_character, get_active_character, record_transaction


# --- CAMPUS DISTRICT ---

@document('Campus', 'Lister les formations', response=CourseSerializer(many=True))
@api_view(['GET'])
@permission_classes([AllowAny])
def list_courses(request):
    """Lists all available courses in the Campus District."""
    courses = Course.objects.all()
    return Response(CourseSerializer(courses, many=True).data)


def serialize_enrollment(enrollment):
    return {
        'courseKey': enrollment.course.key,
        'status': enrollment.status,
        'validatedModules': enrollment.validated_modules,
        'totalModules': len(enrollment.course.modules or []),
        'paidAmount': enrollment.paid_amount,
    }


def complete_course_for_character(character, course):
    """
    Attribue une seule fois les compétences, la certification et l'XP d'une formation (§23).
    Appelée uniquement lors du passage de l'inscription à l'état « terminée ».
    """
    skills_map = course.skills_awarded or {}
    if skills_map:
        skill_objs = {s.key: s for s in Skill.objects.filter(key__in=skills_map.keys())}
        existing_cs = {cs.skill_id: cs for cs in CharacterSkill.objects.filter(character=character, skill__key__in=skills_map.keys())}
        to_update, to_create = [], []
        for skey, gain in skills_map.items():
            sobj = skill_objs.get(skey)
            if not sobj:
                continue
            if sobj.id in existing_cs:
                cs = existing_cs[sobj.id]
                cs.level_percent = min(100, cs.level_percent + gain)
                to_update.append(cs)
            else:
                to_create.append(CharacterSkill(character=character, skill=sobj, level_percent=min(100, 10 + gain)))
        if to_update:
            CharacterSkill.objects.bulk_update(to_update, ['level_percent'])
        if to_create:
            CharacterSkill.objects.bulk_create(to_create)

    completed = list(character.completed_courses or [])
    if course.key not in completed:
        completed.append(course.key)
        character.completed_courses = completed
    if course.certification_name:
        Certification.objects.get_or_create(character=character, title=course.certification_name)

    character.energy = max(10, character.energy - 15)
    level_up = add_xp_to_character(character, course.xp_reward)
    character.save()
    return level_up


@document('Campus', "S'inscrire à une formation (frais prélevés)")
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enroll_in_course(request, key):
    """
    Inscrit le citoyen à une formation et prélève les frais côté serveur (§5.1, §10.3).
    Idempotent : se ré-inscrire à une formation déjà suivie ou terminée ne coûte rien.
    """
    course = get_object_or_404(Course, key=key)
    character = get_active_character(request)

    with db_transaction.atomic():
        character = Character.objects.select_for_update().get(id=character.id)
        enrollment = CourseEnrollment.objects.filter(character=character, course=course).select_related('course').first()
        if enrollment:
            return Response({
                'message': "Tu es déjà inscrit(e) à cette formation.",
                'alreadyEnrolled': True,
                'enrollment': serialize_enrollment(enrollment),
                'citizen': CitizenDetailSerializer(character).data,
            })

        if character.money < course.cost:
            return Response({
                'error': f"Fonds insuffisants. Cette formation coûte {course.cost:,} MGA (solde : {character.money:,} MGA)."
            }, status=status.HTTP_400_BAD_REQUEST)

        money_before = character.money
        character.money -= course.cost
        character.save()
        enrollment = CourseEnrollment.objects.create(character=character, course=course, paid_amount=course.cost)
        tx = None
        if course.cost > 0:
            tx = record_transaction(
                character,
                label=f"Frais de formation : {course.title}",
                amount=-course.cost,
                transaction_type='expense',
                category='Éducation',
                money_before=money_before,
            )

    return Response({
        'message': f"Inscription validée : {course.title}. {course.cost:,} MGA prélevés.",
        'alreadyEnrolled': False,
        'enrollment': serialize_enrollment(enrollment),
        'transaction': TransactionSerializer(tx).data if tx else None,
        'citizen': CitizenDetailSerializer(character).data,
    }, status=status.HTTP_201_CREATED)


@document('Campus', "Valider le quiz d'un module", request=QuizAnswerRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_course_quiz(request, key):
    """
    Pipeline pédagogique (§13.1, §23) : les modules se valident dans l'ordre, par quiz.
    La formation est terminée — et récompensée une seule fois — quand le dernier module est validé.
    Rejouer un module déjà validé donne le retour pédagogique mais aucune récompense.
    """
    course = get_object_or_404(Course, key=key)
    character = get_active_character(request)

    try:
        module_index = int(request.data.get('moduleIndex', 0))
    except (ValueError, TypeError):
        module_index = 0

    try:
        answer_index = int(request.data.get('answerIndex', -1))
    except (ValueError, TypeError):
        answer_index = -1

    modules = course.modules or []
    if module_index < 0 or module_index >= len(modules):
        return Response({'detail': "Index de module invalide.", 'error': "Index de module invalide."}, status=status.HTTP_400_BAD_REQUEST)

    quiz_data = modules[module_index].get('quiz', {})
    is_correct = (answer_index == quiz_data.get('correctIndex', 0))
    explanation = quiz_data.get('explanation', '')
    is_last_module = (module_index == len(modules) - 1)
    is_course_completed = False
    level_up = False
    xp_awarded = 0

    with db_transaction.atomic():
        character = Character.objects.select_for_update().select_related('current_housing', 'current_job').get(id=character.id)
        enrollment = CourseEnrollment.objects.select_for_update().filter(character=character, course=course).first()
        if not enrollment:
            return Response({'error': "Inscris-toi d'abord à cette formation."}, status=status.HTTP_400_BAD_REQUEST)

        if enrollment.status == 'in_progress':
            if module_index > enrollment.validated_modules:
                return Response(
                    {'error': "Valide d'abord les modules précédents."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if is_correct and module_index == enrollment.validated_modules:
                enrollment.validated_modules += 1
                if enrollment.validated_modules >= len(modules):
                    enrollment.status = 'completed'
                    enrollment.completed_at = timezone.now()
                    level_up = complete_course_for_character(character, course)
                    xp_awarded = course.xp_reward
                    is_course_completed = True
                enrollment.save()

    if is_course_completed:
        award_badges(character)

    return Response({
        'isCorrect': is_correct,
        'explanation': explanation,
        'moduleIndex': module_index,
        'isLastModule': is_last_module,
        'isCourseCompleted': is_course_completed,
        'xpAwarded': xp_awarded,
        'levelUp': level_up,
        'skillsAwarded': course.skills_awarded if is_course_completed else {},
        'certificationName': course.certification_name if is_course_completed else None,
        'enrollment': serialize_enrollment(enrollment),
        'citizen': CitizenDetailSerializer(character).data,
    })
