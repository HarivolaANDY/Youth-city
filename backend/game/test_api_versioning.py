"""Tests du versionnement de l'API (/api/v1/) et de la documentation OpenAPI."""
import unittest

from django.conf import settings
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase


class ApiVersioningTests(APITestCase):
    def test_v1_and_legacy_alias_serve_the_same_endpoint(self):
        # Sans compte : refus identique sur les deux préfixes (plus de personnage anonyme partagé)
        self.assertEqual(self.client.get('/api/v1/game/state/').status_code, 401)
        self.assertEqual(self.client.get('/api/game/state/').status_code, 401)

        # Avec un compte authentifié : même réponse sur les deux préfixes
        self.client.force_authenticate(user=User.objects.create_user(username='versioning_user', password='SecurePassword2026!'))
        v1 = self.client.get('/api/v1/game/state/')
        legacy = self.client.get('/api/game/state/')
        self.assertEqual(v1.status_code, 200)
        self.assertEqual(legacy.status_code, 200)

    def test_health_check_is_public_and_exposes_no_game_data(self):
        # Utilisée par le HEALTHCHECK Docker : doit répondre sans compte
        response = self.client.get('/api/v1/health/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'status': 'ok'})

    def test_url_names_resolve_to_v1(self):
        self.assertEqual(reverse('auth-login'), '/api/v1/auth/login/')
        self.assertEqual(reverse('legacy:auth-login'), '/api/auth/login/')

    def test_public_passport_verification_available_on_v1(self):
        response = self.client.get('/api/v1/passport/verify/CODE-INCONNU/')
        self.assertIn(response.status_code, (400, 404))


@unittest.skipUnless(settings.API_DOCS_ENABLED, "Documentation OpenAPI désactivée (DEBUG=False)")
class OpenApiSchemaTests(APITestCase):
    def test_schema_is_served_and_documents_only_v1(self):
        response = self.client.get('/api/v1/schema/', HTTP_ACCEPT='application/vnd.oai.openapi+json')
        self.assertEqual(response.status_code, 200)
        paths = response.json()['paths']
        self.assertTrue(paths)
        self.assertTrue(all(p.startswith('/api/v1/') for p in paths))
        self.assertIn('/api/v1/auth/login/', paths)

    def test_swagger_ui_is_served(self):
        self.assertEqual(self.client.get('/api/v1/docs/').status_code, 200)
