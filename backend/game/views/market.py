"""Market District : achats."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction as db_transaction


from game.models import (
    Character,
    MarketItem,
)
from game.serializers import (
    TransactionSerializer,
    CitizenDetailSerializer,
    MarketItemSerializer,
)

from game.api_docs import (
    document,
    BuyItemRequest,
)
from game.views.common import get_active_character, record_transaction


@document('Marché', 'Lister les articles', response=MarketItemSerializer(many=True))
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_market_items(request):
    """Returns the market catalog of nourishment, equipment, and mobility goods (§11, §19)."""
    character = get_active_character(request)
    category = request.query_params.get('category')
    items = MarketItem.objects.all().order_by('price')
    if category:
        items = items.filter(category=category)
    serializer = MarketItemSerializer(items, many=True, context={'character': character})
    return Response(serializer.data)


@document('Marché', 'Acheter un article', request=BuyItemRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def buy_market_item(request):
    """Purchases an item: immediate vitality effect or permanent equipment inventory (§11, §19)."""
    item_key = request.data.get('itemKey') or request.data.get('item_key')
    if not item_key:
        return Response({'error': "Clé d'article manquante."}, status=status.HTTP_400_BAD_REQUEST)

    item = MarketItem.objects.filter(key=item_key).first()
    if not item:
        return Response({'error': "Article introuvable au Market District."}, status=status.HTTP_404_NOT_FOUND)

    character = get_active_character(request)

    with db_transaction.atomic():
        character = Character.objects.select_for_update().get(id=character.id)

        if not item.is_consumable:
            inventory = list(character.inventory or [])
            if item.key in inventory:
                return Response({'error': "Tu possèdes déjà cet équipement dans ton inventaire."}, status=status.HTTP_400_BAD_REQUEST)

        if character.money < item.price:
            return Response({
                'error': f"Fonds insuffisants. Tu as {character.money:,} MGA mais cet article coûte {item.price:,} MGA."
            }, status=status.HTTP_400_BAD_REQUEST)

        if not item.is_consumable:
            inventory = list(character.inventory or [])
            inventory.append(item.key)
            character.inventory = inventory
            message = f"Équipement acquis : {item.name}. Ajouté à ton inventaire !"
        else:
            message = f"Dégustation terminée : {item.name}. Vitalité restaurée !"

        money_before = character.money
        character.money -= item.price
        if item.energy_bonus > 0:
            character.energy = min(100, character.energy + item.energy_bonus)
        if item.wellbeing_bonus > 0:
            character.wellbeing = min(100, character.wellbeing + item.wellbeing_bonus)

        character.save()
        tx = record_transaction(
            character,
            label=f"Achat Market : {item.name}",
            amount=-item.price,
            transaction_type='expense',
            category='Market',
            money_before=money_before,
        )

    return Response({
        'message': message,
        'citizen': CitizenDetailSerializer(character).data,
        'transaction': TransactionSerializer(tx).data,
        'item': MarketItemSerializer(item, context={'character': character}).data,
    })


