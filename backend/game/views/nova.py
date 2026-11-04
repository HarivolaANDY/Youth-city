"""Mentor IA NOVA : chat et guidance proactive."""
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from game import nova_ai
from game.throttles import NovaChatDailyThrottle, NovaChatRateThrottle
from game.sanitizers import (
    sanitize_text,
    detect_indirect_prompt_injection,
)


from game.api_docs import (
    document,
    NovaChatRequest,
)
from game.views.common import get_active_character


# ============================================================
# 🤖 Mentor IA NOVA & Sécurité Throttling (§27, §28 — P2/P3/P4)
# ============================================================

@document('NOVA', 'Discuter avec le mentor NOVA', request=NovaChatRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([NovaChatRateThrottle, NovaChatDailyThrottle])
def chat_with_nova(request):
    """
    Assistant d'orientation et mentorat IA NOVA (§27, §28).
    Applique le throttling dédié (P3) et les filtres anti-injection (P2/P4).
    """
    character = get_active_character(request)
    raw_message = request.data.get('message', '')

    if not str(raw_message).strip():
        return Response({'error': "Message requis."}, status=status.HTTP_400_BAD_REQUEST)

    # Max length guardrail (500 chars)
    if len(str(raw_message)) > 500:
        return Response({
            'error': "Le message dépasse la limite autorisée de 500 caractères."
        }, status=status.HTTP_400_BAD_REQUEST)

    # Sanitization & indirect injection detection
    clean_message = sanitize_text(str(raw_message), max_length=500, allow_multiline=True)
    is_inj, _ = detect_indirect_prompt_injection(clean_message)

    lower = clean_message.lower()
    # NOVA ne peut de toute façon rien modifier du jeu (texte seul) : on ne garde que les motifs d'injection explicites.
    if is_inj or 'grant me' in lower:
        return Response({
            'reply': (
                "⚠️ Alerte Garde-Fou : Requête non autorisée. "
                "En tant que mentor de Youth City, mes règles éthiques et directives d'apprentissage "
                "ne peuvent pas être contournées. Repartons sur un conseil constructif pour ta carrière !"
            ),
            'isGuardrailTriggered': True,
        })

    # Réponse du fournisseur IA configuré (§17.2), avec repli sur les règles locales en cas d'échec
    reply, source = nova_ai.generate_reply(character, clean_message)

    return Response({
        'reply': reply,
        'citizenName': character.name,
        'isGuardrailTriggered': False,
        'source': source,
    })


@document('NOVA', 'Prochaine action recommandée par NOVA')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_nova_proactive_guidance(request):
    """
    Composant Universel « Next Action » & Conseils Proactifs de NOVA (§27, §28, §57).
    Génère l'action prioritaire contextualisée, les alertes budgétaires/carrière proactives
    et la checklist du plan d'action journalier de NOVA.
    """
    character = get_active_character(request)
    completed_courses = character.completed_courses or []
    has_startup = character.startup_projects.exists()
    has_guild = hasattr(character, 'guild_membership') and character.guild_membership is not None
    has_job = character.current_job is not None
    js_skill = 0
    for cs in character.skills.select_related('skill').all():
        if cs.skill.key == 'javascript':
            js_skill = cs.level_percent
            break

    # 1. Calcul de la "Next Action" Universelle (§57)
    if character.energy < 25:
        priority_action = {
            'id': 'action-sleep-residential',
            'title': 'Repos vital urgent au Résidentiel !',
            'description': 'Ton énergie est descendue sous le seuil critique des 25%. Rentre te reposer pour reconstituer tes forces avant d\'entamer toute activité.',
            'reward': '+40% à +80% Énergie',
            'targetTab': 'residential',
            'urgency': 'urgent',
            'icon': 'Moon',
            'buttonText': 'Aller se reposer',
        }
    elif character.money < 50000 and character.savings < 20000:
        priority_action = {
            'id': 'action-emergency-income',
            'title': 'Trésorerie basse : Mission freelance d\'urgence',
            'description': 'Ton solde courant est inférieur à 50 000 MGA. Réalise une mission courte au Business District pour regarnir tes liquidités sans t\'endetter.',
            'reward': '+60 000 à 120 000 MGA',
            'targetTab': 'career',
            'urgency': 'high',
            'icon': 'Zap',
            'buttonText': 'Voir les missions freelance',
        }
    elif 'course-web-dev' not in completed_courses and js_skill < 50:
        priority_action = {
            'id': 'action-campus-course',
            'title': 'Pipeline Pédagogique au Campus District (§23)',
            'description': 'Suis la formation « Développement Web Fondamental », réussis le quiz de contrôle et débloque le certificat officiel Junior.',
            'reward': '+150 XP & +20% Compétences',
            'targetTab': 'campus',
            'urgency': 'medium',
            'icon': 'BookOpen',
            'buttonText': 'Ouvrir le Campus',
        }
    elif not has_job and js_skill >= 50:
        priority_action = {
            'id': 'action-job-apply',
            'title': 'Postule chez TechSolutions au Business District',
            'description': 'Tes compétences en développement web correspondent aux prérequis du poste Développeur Junior (450 000 MGA/mois).',
            'reward': '+120 XP & Salaire régulier',
            'targetTab': 'career',
            'urgency': 'medium',
            'icon': 'Briefcase',
            'buttonText': 'Postuler au job',
        }
    elif character.money >= 200000 and character.savings < 150000:
        priority_action = {
            'id': 'action-deposit-savings',
            'title': 'Sécurise ton épargne au Finance District (§27)',
            'description': 'Alimente ton livret de précaution pour constituer une réserve de sécurité d\'au moins 2 mois de loyer.',
            'reward': 'Stabilité financière & Rendement',
            'targetTab': 'finance',
            'urgency': 'normal',
            'icon': 'Landmark',
            'buttonText': 'Gérer mon épargne',
        }
    elif character.money >= 300000 and not has_startup:
        priority_action = {
            'id': 'action-launch-startup',
            'title': 'Amorçage entrepreneurial au Startup District (§24)',
            'description': 'Tu as le capital nécessaire pour lancer ton MVP et prétendre à la subvention d\'amorçage de l\'incubateur citoyen.',
            'reward': '+300 XP & Dividendes futurs',
            'targetTab': 'startup',
            'urgency': 'normal',
            'icon': 'Rocket',
            'buttonText': 'Lancer ma Startup',
        }
    else:
        priority_action = {
            'id': 'action-daily-shift',
            'title': 'Effectue ton quart de travail ou mission freelance',
            'description': 'Perçois tes revenus virtuels du jour, monte en réputation et consolide ton Career Passport.',
            'reward': '+40 XP & Salaire du shift',
            'targetTab': 'career',
            'urgency': 'normal',
            'icon': 'Briefcase',
            'buttonText': 'Travailler',
        }

    # 2. Conseil Proactif de NOVA (§27)
    if character.savings < 50000:
        proactive_tip = (
            f"Attention {character.name} : Ton épargne s'élève à {character.savings:,} MGA. "
            "Un imprévu pourrait déstabiliser ton budget. Épargne au moins 20 000 MGA sur ton livret de précaution dès aujourd'hui."
        )
    elif len(completed_courses) >= 2 and not has_job:
        proactive_tip = (
            f"Félicitations {character.name} ! Tu as validé {len(completed_courses)} formations. "
            "Ton Career Passport est très attractif : deux entreprises du Business District recherchent ton profil !"
        )
    elif character.energy < 40:
        proactive_tip = (
            "Ton niveau d'énergie commence à faiblir. Veille à ne pas enchaîner trop d'actions intenses sans passer par le Résidentiel."
        )
    else:
        proactive_tip = (
            "Excellente dynamique citoyenne ! Équilibre toujours tes trois piliers : "
            "Savoir (Campus), Autonomie financière (Business & Finance) et Vitalité (Résidentiel)."
        )

    # 3. Plan d'Action Journalier NOVA (§28)
    daily_checklist = [
        {
            'id': 'task-campus',
            'label': 'Terminer ou réviser un module de formation (Campus District)',
            'completed': len(completed_courses) > 0,
            'targetTab': 'campus',
            'xpBonus': 50,
        },
        {
            'id': 'task-career',
            'label': 'Postuler à un emploi ou accomplir une mission freelance (Business District)',
            'completed': has_job,
            'targetTab': 'career',
            'xpBonus': 60,
        },
        {
            'id': 'task-finance',
            'label': 'Déposer au moins 20 000 MGA sur le livret d\'épargne (Finance District)',
            'completed': character.savings >= 50000,
            'targetTab': 'finance',
            'xpBonus': 40,
        },
        {
            'id': 'task-social-startup',
            'label': 'Rejoindre une Guilde ou développer un projet de Startup',
            'completed': has_startup or has_guild,
            'targetTab': 'cityhub' if not has_startup else 'startup',
            'xpBonus': 75,
        },
    ]

    return Response({
        'citizenName': character.name,
        'day': character.day,
        'priorityAction': priority_action,
        'proactiveTip': proactive_tip,
        'dailyChecklist': daily_checklist,
        'economicStats': {
            'money': character.money,
            'savings': character.savings,
            'energy': character.energy,
            'wellbeing': character.wellbeing,
            'completedCoursesCount': len(completed_courses),
            'certificationsCount': character.certifications.count(),
        }
    })

