"""
Documentation OpenAPI des endpoints (drf-spectacular).

Les vues sont des fonctions `@api_view` : le schéma ne peut donc pas être deviné.
Ce module centralise les serializers *d'entrée* (corps de requête) et le décorateur
`document()` qui rattache chaque endpoint à son tag, son résumé et ses types.
Ces serializers ne servent qu'à la documentation : la validation reste faite dans les vues.
"""
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework import serializers


def document(tag, summary, request=None, response=None):
    """Décore une vue `@api_view` (à placer AU-DESSUS de `@api_view`)."""
    return extend_schema(
        tags=[tag],
        summary=summary,
        request=request,
        responses=response if response is not None else OpenApiTypes.OBJECT,
    )


# --- Game loop -------------------------------------------------------------

class AdvanceDayRequest(serializers.Serializer):
    days = serializers.IntegerField(required=False, min_value=1, max_value=60, default=1)


class ChangeHousingRequest(serializers.Serializer):
    housing_id = serializers.CharField()


class ResetGameRequest(serializers.Serializer):
    preset = serializers.CharField(required=False, default='demo')


# --- Auth ------------------------------------------------------------------

class LoginRequest(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


# --- Campus ----------------------------------------------------------------

class QuizAnswerRequest(serializers.Serializer):
    moduleIndex = serializers.IntegerField(required=False, default=0)
    answerIndex = serializers.IntegerField()


# --- Business --------------------------------------------------------------

class InterviewAnswerRequest(serializers.Serializer):
    answerIndex = serializers.IntegerField()


# --- Finance ---------------------------------------------------------------

class AmountRequest(serializers.Serializer):
    amount = serializers.IntegerField(help_text="Montant en MGA")


# --- Dilemmas --------------------------------------------------------------

class ResolveDilemmaRequest(serializers.Serializer):
    option_id = serializers.CharField()
    dilemma_key = serializers.CharField(required=False)


# --- Market ----------------------------------------------------------------

class BuyItemRequest(serializers.Serializer):
    itemKey = serializers.CharField()


# --- Startup ---------------------------------------------------------------

class CreateStartupRequest(serializers.Serializer):
    name = serializers.CharField()
    pitch = serializers.CharField()
    sector = serializers.CharField(required=False)
    initialCapital = serializers.IntegerField(required=False, default=30000)


class StartupActionRequest(serializers.Serializer):
    actionType = serializers.CharField()
    role = serializers.CharField(required=False)


# --- City Hub --------------------------------------------------------------

class ParticipateHackathonRequest(serializers.Serializer):
    teamName = serializers.CharField(required=False)
    submissionPitch = serializers.CharField(required=False)
    teamMembers = serializers.ListField(child=serializers.CharField(), required=False)


class SendMessageRequest(serializers.Serializer):
    recipientId = serializers.CharField()
    content = serializers.CharField()
    contextTag = serializers.CharField(required=False)


# --- Admin & modération ----------------------------------------------------

class CreateReportRequest(serializers.Serializer):
    targetType = serializers.CharField()
    targetId = serializers.CharField()
    targetName = serializers.CharField(required=False)
    reason = serializers.CharField()
    details = serializers.CharField(required=False)


class ResolveReportRequest(serializers.Serializer):
    action = serializers.CharField(required=False, default='none')
    status = serializers.CharField(required=False, default='resolved')
    notes = serializers.CharField(required=False, allow_blank=True)


class GrantStipendRequest(serializers.Serializer):
    characterId = serializers.CharField()
    amount = serializers.IntegerField(required=False, default=50000, help_text="Montant en MGA")
    reason = serializers.CharField(required=False)


# --- NOVA ------------------------------------------------------------------

class NovaChatRequest(serializers.Serializer):
    message = serializers.CharField()
