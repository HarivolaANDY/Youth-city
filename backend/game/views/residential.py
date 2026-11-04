"""Residential District : logements."""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404


from game.models import (
    Property,
)
from game.serializers import (
    PropertySerializer,
    CitizenDetailSerializer,
)

from game.api_docs import (
    document,
    ChangeHousingRequest,
)
from game.views.common import get_active_character


@document('Résidentiel', 'Changer de logement', request=ChangeHousingRequest)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_housing(request):
    """Switches the citizen's primary residence."""
    character = get_active_character(request)
    housing_id = request.data.get('housing_id')
    if not housing_id:
        return Response({'error': 'housing_id est requis.'}, status=status.HTTP_400_BAD_REQUEST)

    prop = get_object_or_404(Property, key=housing_id)
    character.current_housing = prop
    character.save()

    return Response({
        'message': f"Tu as emménagé dans : {prop.name}",
        'currentHousingId': prop.key,
        'citizen': CitizenDetailSerializer(character).data,
    })


# --- RESIDENTIAL DISTRICT ---

@document('Résidentiel', 'Lister les logements', response=PropertySerializer(many=True))
@api_view(['GET'])
@permission_classes([AllowAny])
def list_properties(request):
    """Lists housing properties available in the Residential District."""
    properties = Property.objects.all()
    return Response(PropertySerializer(properties, many=True).data)


