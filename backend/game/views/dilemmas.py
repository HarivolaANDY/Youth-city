"""Dilemmes et événements aléatoires."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction as db_transaction


from game.models import (
    Skill,
    Character,
    CharacterSkill,
    Dilemma,
)
from game.serializers import (
    DilemmaSerializer,
    CitizenDetailSerializer,
)

from game.api_docs import (
    document,
    ResolveDilemmaRequest,
)
from game.views.common import add_xp_to_character, get_active_character, record_transaction


# --- DILEMMAS & ALÉAS ---

def evaluate_and_trigger_dynamic_event(character, force=False):
    """
    Moteur de déclenchement d'événements et d'aléas contextuels (§26, §48, §53).
    Évalue le profil et le contexte du citoyen :
    - Emploi actif ou non
    - Startups en cours ou non
    - Niveau citoyen et jour
    - Aléas déjà résolus (évite la répétition immédiate)
    """
    if character.active_dilemma_key:
        existing = Dilemma.objects.filter(key=character.active_dilemma_key).first()
        if existing:
            return existing

    # Déclenchement automatique selon le rythme du jeu (jours pairs ou force)
    if not force:
        should_trigger = (character.day % 2 == 0) and character.time_slot.startswith('Matin')
        if not should_trigger:
            return None

    resolved_keys = set(character.resolved_dilemmas or [])
    all_dilemmas = list(Dilemma.objects.all())
    if not all_dilemmas:
        return None

    # Filtrage contextuel
    has_job = character.current_job is not None
    has_startup = character.startup_projects.exists()
    candidates = []

    for d in all_dilemmas:
        conds = d.conditions or {}
        if conds.get('has_job') and not has_job:
            continue
        if conds.get('has_startup') and not has_startup:
            continue
        if 'min_level' in conds and character.level < conds['min_level']:
            continue
        if 'min_day' in conds and character.day < conds['min_day']:
            continue
        if 'max_savings' in conds and character.savings > conds['max_savings']:
            continue
        if 'min_savings' in conds and character.savings < conds['min_savings']:
            continue
        candidates.append(d)

    if not candidates:
        candidates = all_dilemmas

    # Priorité aux dilemmes non encore résolus
    unresolved_candidates = [d for d in candidates if d.key not in resolved_keys]
    pool = unresolved_candidates if unresolved_candidates else candidates

    chosen_idx = (character.day * 7 + character.id * 13) % len(pool)
    chosen = pool[chosen_idx]

    character.active_dilemma_key = chosen.key
    character.save(update_fields=['active_dilemma_key'])
    return chosen


@document('Dilemmes', 'Dilemme actif du citoyen')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_dilemma(request):
    """Récupère le dilemme/aléa actif ou évalue le prochain événement dynamique (§26)."""
    character = get_active_character(request)
    dilemma = None
    if character.active_dilemma_key:
        dilemma = Dilemma.objects.filter(key=character.active_dilemma_key).first()
    if not dilemma:
        dilemma = evaluate_and_trigger_dynamic_event(character, force=False)
    if not dilemma:
        return Response({'dilemma': None})
    return Response(DilemmaSerializer(dilemma).data)


@document('Dilemmes', 'Déclencher un événement dynamique')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_dynamic_event(request):
    """Déclenche ou force l'apparition d'un aléa/événement dynamique contextuel (§26)."""
    character = get_active_character(request)
    dilemma = evaluate_and_trigger_dynamic_event(character, force=True)
    if not dilemma:
        return Response({'success': False, 'message': 'Aucun événement disponible actuellement.'})
    return Response({
        'success': True,
        'dilemma': DilemmaSerializer(dilemma).data,
    })


@document('Dilemmes', 'Résoudre un dilemme', request=ResolveDilemmaRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resolve_dilemma(request):
    """Applique les conséquences du choix d'un dilemme ou aléa dynamique (§25, §26)."""
    character = get_active_character(request)
    option_id = request.data.get('option_id')

    with db_transaction.atomic():
        character = Character.objects.select_for_update().select_related('current_housing', 'current_job').get(id=character.id)

        # Seul le dilemme réellement déclenché pour ce citoyen peut être résolu, et une seule fois :
        # le client ne choisit ni la situation ni ses gains (§10.3, §15).
        dilemma_key = character.active_dilemma_key
        if not dilemma_key:
            return Response({'error': "Aucun dilemme en cours à résoudre."}, status=status.HTTP_400_BAD_REQUEST)
        client_key = request.data.get('dilemma_key')
        if client_key and client_key != dilemma_key:
            return Response({'error': "Ce dilemme n'est pas celui en cours."}, status=status.HTTP_400_BAD_REQUEST)

        dilemma = get_object_or_404(Dilemma, key=dilemma_key)
        selected_option = next((opt for opt in dilemma.options if opt.get('id') == option_id), None)
        if not selected_option:
            return Response({'error': 'Option invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        cost_money = selected_option.get('costMoney', 0)
        cost_energy = selected_option.get('costEnergy', 0)
        gain_xp = selected_option.get('gainXp', 0)
        gain_money = selected_option.get('gainMoney', 0)
        impact_skills = selected_option.get('impactSkills', {})
        consequence_text = selected_option.get('consequenceText', '')

        if cost_money > 0 and character.money < cost_money:
            return Response({
                'error': f"Fonds insuffisants ({character.money:,} MGA disponibles pour un coût de {cost_money:,} MGA)."
            }, status=status.HTTP_400_BAD_REQUEST)

        if cost_money > 0:
            money_before = character.money
            character.money -= cost_money
            record_transaction(
                character,
                label=f"Aléa [{dilemma.title[:30]}] : {selected_option.get('text')[:50]}",
                amount=-cost_money,
                transaction_type='expense',
                category='Aléas',
                money_before=money_before,
            )

        if gain_money > 0:
            money_before = character.money
            character.money += gain_money
            record_transaction(
                character,
                label=f"Gain Aléa [{dilemma.title[:30]}]",
                amount=gain_money,
                transaction_type='income',
                category='Aléas',
                money_before=money_before,
            )

        character.energy = max(5, character.energy - cost_energy)
        level_up = add_xp_to_character(character, gain_xp)

        # Impact sur les compétences
        if impact_skills:
            skill_objs = {s.key: s for s in Skill.objects.filter(key__in=impact_skills.keys())}
            existing_cs = {cs.skill_id: cs for cs in CharacterSkill.objects.filter(character=character, skill__key__in=impact_skills.keys())}
            to_update, to_create = [], []
            for skill_key, delta in impact_skills.items():
                skill_obj = skill_objs.get(skill_key)
                if not skill_obj:
                    continue
                if skill_obj.id in existing_cs:
                    cs = existing_cs[skill_obj.id]
                    cs.level_percent = max(0, min(100, cs.level_percent + delta))
                    to_update.append(cs)
                else:
                    to_create.append(CharacterSkill(character=character, skill=skill_obj, level_percent=max(0, min(100, 50 + delta))))
            if to_update:
                CharacterSkill.objects.bulk_update(to_update, ['level_percent'])
            if to_create:
                CharacterSkill.objects.bulk_create(to_create)

        # Enregistrement dans les résolus et réinitialisation du dilemme actif
        resolved_list = character.resolved_dilemmas or []
        if dilemma.key not in resolved_list:
            resolved_list.append(dilemma.key)
            character.resolved_dilemmas = resolved_list
        character.completed_challenges += 1
        character.active_dilemma_key = ""
        character.save()

    return Response({
        'message': consequence_text,
        'levelUp': level_up,
        'dilemmaResolvedKey': dilemma.key,
        'citizen': CitizenDetailSerializer(character).data,
    })


