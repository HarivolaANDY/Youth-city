from django.test import TestCase
from django.core.management import call_command
from rest_framework.test import APITestCase
from rest_framework import status
from game.models import Character, Property, Job, Course, Transaction

class YouthCityBackendAPITests(APITestCase):
    def setUp(self):
        # Run seed command to populate baseline data
        call_command('seed_game_data')
        self.character = Character.objects.first()

    def test_01_get_game_state(self):
        """Tests that game state returns properly formatted citizen, day, time slot, and transactions."""
        response = self.client.get('/api/game/state/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('citizen', data)
        self.assertEqual(data['citizen']['name'], 'Emmanuel')
        self.assertEqual(data['citizen']['money'], 425000)
        self.assertEqual(data['citizen']['savings'], 200000)
        self.assertIn('transactions', data)
        self.assertIn('day', data)
        self.assertIn('timeSlot', data)

    def test_02_advance_time(self):
        """Tests advancing time slots."""
        initial_slot = self.character.time_slot
        response = self.client.post('/api/game/advance_time/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertNotEqual(data['timeSlot'], initial_slot)

    def test_03_rest_and_sleep(self):
        """Tests energy restoration via rest and sleep."""
        self.character.energy = 30
        self.character.save()
        response = self.client.post('/api/game/sleep/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertGreater(data['energy'], 30)

    def test_04_change_housing(self):
        """Tests switching to a different housing property."""
        response = self.client.post('/api/game/housing/', {'housing_id': 'housing-room'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.character.refresh_from_db()
        self.assertEqual(self.character.current_housing.key, 'housing-room')

    def test_05_list_and_complete_course(self):
        """Tests campus course catalog and course module validation."""
        list_res = self.client.get('/api/campus/courses/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(list_res.json()), 1)

        complete_res = self.client.post('/api/campus/courses/course-web-dev/complete/')
        self.assertEqual(complete_res.status_code, status.HTTP_200_OK)
        self.character.refresh_from_db()
        self.assertIn('course-web-dev', self.character.completed_courses)

    def test_06_hire_and_work_shift(self):
        """Tests job hiring and work shift daily wage in MGA."""
        hire_res = self.client.post('/api/business/jobs/job-dev-junior/hire/')
        self.assertEqual(hire_res.status_code, status.HTTP_200_OK)
        self.character.refresh_from_db()
        self.assertEqual(self.character.current_job.key, 'job-dev-junior')

        initial_money = self.character.money
        shift_res = self.client.post('/api/business/work_shift/')
        self.assertEqual(shift_res.status_code, status.HTTP_200_OK)
        self.character.refresh_from_db()
        expected_daily_wage = round(450000 / 20)
        self.assertEqual(self.character.money, initial_money + expected_daily_wage)

    def test_07_finance_savings_deposit_and_withdraw(self):
        """Tests depositing and withdrawing savings in MGA."""
        deposit_res = self.client.post('/api/finance/deposit/', {'amount': 50000})
        self.assertEqual(deposit_res.status_code, status.HTTP_200_OK)
        self.character.refresh_from_db()
        self.assertEqual(self.character.savings, 250000)
        self.assertEqual(self.character.money, 375000)

        withdraw_res = self.client.post('/api/finance/withdraw/', {'amount': 20000})
        self.assertEqual(withdraw_res.status_code, status.HTTP_200_OK)
        self.character.refresh_from_db()
        self.assertEqual(self.character.savings, 230000)
        self.assertEqual(self.character.money, 395000)

    def test_08_resolve_dilemma(self):
        """Tests dilemma choice consequence execution."""
        res = self.client.post('/api/dilemmas/resolve/', {
            'dilemma_key': 'dilemma-broken-laptop',
            'option_id': 'opt-repair',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.character.refresh_from_db()
        self.assertEqual(self.character.money, 425000 - 90000)

    def test_09_auth_registration_and_login_flow(self):
        """Tests user registration, JWT generation, login, and profile retrieval."""
        reg_payload = {
            'username': 'harivola_test',
            'email': 'harivola@test.local',
            'password': 'SecurePassword2026!',
            'citizenName': 'Harivola Citoyen',
        }
        reg_res = self.client.post('/api/auth/register/', reg_payload)
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        reg_data = reg_res.json()
        self.assertIn('tokens', reg_data)
        self.assertIn('access', reg_data['tokens'])
        self.assertIn('citizen', reg_data)
        self.assertEqual(reg_data['citizen']['name'], 'Harivola Citoyen')
        self.assertEqual(reg_data['user']['username'], 'harivola_test')

        # Test login
        login_res = self.client.post('/api/auth/login/', {
            'username': 'harivola_test',
            'password': 'SecurePassword2026!',
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        login_data = login_res.json()
        access_token = login_data['tokens']['access']

        # Test authenticated me endpoint
        me_res = self.client.get('/api/auth/me/', HTTP_AUTHORIZATION=f'Bearer {access_token}')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        me_data = me_res.json()
        self.assertEqual(me_data['user']['username'], 'harivola_test')
        self.assertEqual(me_data['citizen']['name'], 'Harivola Citoyen')

        # Test game state for authenticated user (isolated from demo user)
        state_res = self.client.get('/api/game/state/', HTTP_AUTHORIZATION=f'Bearer {access_token}')
        self.assertEqual(state_res.status_code, status.HTTP_200_OK)
        state_data = state_res.json()
        self.assertEqual(state_data['citizen']['name'], 'Harivola Citoyen')

    def test_10_auth_throttling_and_security_controls(self):
        """Verifies generic error responses and brute-force throttling on login."""
        # 1. Non-existent account returns generic 401
        res = self.client.post('/api/auth/login/', {
            'username': 'ghost_user',
            'password': 'WrongPassword123!',
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.json().get('error'), "Nom d'utilisateur ou mot de passe incorrect.")

        # 2. Trigger throttle limit (auth_login limit is 10/minute)
        for _ in range(9):
            self.client.post('/api/auth/login/', {
                'username': 'ghost_user',
                'password': 'WrongPassword123!',
            })

        # 11th request must be throttled with HTTP 429
        throttled_res = self.client.post('/api/auth/login/', {
            'username': 'ghost_user',
            'password': 'WrongPassword123!',
        })
        self.assertEqual(throttled_res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


