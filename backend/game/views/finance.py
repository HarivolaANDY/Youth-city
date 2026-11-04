"""Finance District : épargne et transactions."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction as db_transaction


from game.models import (
    Character,
    Transaction,
)
from game.serializers import (
    TransactionSerializer,
    CitizenDetailSerializer,
)

from game.api_docs import (
    document,
    AmountRequest,
)
from game.badges import award_badges
from game.views.common import get_active_character, record_transaction


# --- FINANCE DISTRICT ---

@document('Finance', "Déposer sur le compte d'épargne", request=AmountRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deposit_savings(request):
    """Transfers funds from cash to savings in MGA."""
    character = get_active_character(request)
    try:
        amount = int(request.data.get('amount', 0))
    except (ValueError, TypeError):
        return Response({'error': 'Montant invalide.'}, status=status.HTTP_400_BAD_REQUEST)

    if amount <= 0:
        return Response({'error': 'Le montant doit être supérieur à zéro.'}, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        character = Character.objects.select_for_update().get(id=character.id)
        if character.money < amount:
            return Response({
                'error': f"Fonds insuffisants. Solde courant : {character.money:,} MGA."
            }, status=status.HTTP_400_BAD_REQUEST)

        money_before = character.money
        character.money -= amount
        character.savings += amount
        character.save()

        tx = record_transaction(
            character,
            label="Virement vers livret d'épargne",
            amount=-amount,
            transaction_type='savings_in',
            category='Épargne',
            money_before=money_before,
        )
    award_badges(character)

    return Response({
        'message': f"{amount:,} MGA placés avec succès sur ton livret d'épargne.",
        'savings': character.savings,
        'money': character.money,
        'transaction': TransactionSerializer(tx).data,
        'citizen': CitizenDetailSerializer(character).data,
    })


@document('Finance', "Retirer depuis le compte d'épargne", request=AmountRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_savings(request):
    """Transfers funds from savings to cash in MGA."""
    character = get_active_character(request)
    try:
        amount = int(request.data.get('amount', 0))
    except (ValueError, TypeError):
        return Response({'error': 'Montant invalide.'}, status=status.HTTP_400_BAD_REQUEST)

    if amount <= 0:
        return Response({'error': 'Le montant doit être supérieur à zéro.'}, status=status.HTTP_400_BAD_REQUEST)

    with db_transaction.atomic():
        character = Character.objects.select_for_update().get(id=character.id)
        if character.savings < amount:
            return Response({
                'error': f"Épargne insuffisante. Solde épargne : {character.savings:,} MGA."
            }, status=status.HTTP_400_BAD_REQUEST)

        money_before = character.money
        character.savings -= amount
        character.money += amount
        character.save()

        tx = record_transaction(
            character,
            label="Retrait d'épargne vers compte courant",
            amount=amount,
            transaction_type='savings_out',
            category='Épargne',
            money_before=money_before,
        )

    return Response({
        'message': f"{amount:,} MGA transférés sur ton compte courant.",
        'savings': character.savings,
        'money': character.money,
        'transaction': TransactionSerializer(tx).data,
        'citizen': CitizenDetailSerializer(character).data,
    })


@document('Finance', 'Historique des transactions', response=TransactionSerializer(many=True))
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_transactions(request):
    """Retrieves transaction history for the citizen."""
    character = get_active_character(request)
    transactions = Transaction.objects.filter(character=character).order_by('-created_at')[:50]
    return Response(TransactionSerializer(transactions, many=True).data)


