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

    def test_11_character_creation_and_customization(self):
        """Verifies character onboarding and customization with archetype and vocation (§14, §47)."""
        # Register user
        reg_res = self.client.post('/api/auth/register/', {
            'username': 'aina_maker',
            'password': 'SecurePassword2026!',
            'citizenName': 'Initial Name',
        })
        self.assertEqual(reg_res.status_code, status.HTTP_201_CREATED)
        access_token = reg_res.json()['tokens']['access']

        # 1. Validation error on too short name
        bad_res = self.client.post(
            '/api/character/customize/',
            {'name': 'A', 'archetype': 'pragmatic_saver'},
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Successful customization with archetype 'pragmatic_saver' and vocation 'finance'
        custom_payload = {
            'name': 'Aina Razafy',
            'avatarSeed': 'anita',
            'archetype': 'pragmatic_saver',
            'vocation': 'finance',
        }
        res = self.client.post(
            '/api/character/customize/',
            custom_payload,
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        citizen = data['citizen']

        self.assertEqual(citizen['name'], 'Aina Razafy')
        self.assertEqual(citizen['avatarSeed'], 'anita')
        self.assertEqual(citizen['money'], 180000)
        self.assertEqual(citizen['savings'], 170000)
        self.assertEqual(citizen['energy'], 80)
        self.assertEqual(citizen['skills']['budget'], 35)
        self.assertIn("épargne", citizen['currentObjective']['title'].lower())
        self.assertEqual(len(data['transactions']), 1)
        self.assertEqual(data['transactions'][0]['category'], 'Bienvenue')

    def test_12_market_items_and_purchase_flow(self):
        """Verifies market catalog listing, consumable nourishment, and equipment inventory flow (§11, §19)."""
        # 1. Catalog listing
        res = self.client.get('/api/market/items/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        items = res.json()
        self.assertGreaterEqual(len(items), 5)
        item_keys = [item['id'] for item in items]
        self.assertIn('meal-street', item_keys)
        self.assertIn('item-laptop', item_keys)

        # 2. Purchase consumable meal
        self.character.energy = 40
        self.character.wellbeing = 70
        initial_money = self.character.money
        self.character.save()

        buy_res = self.client.post('/api/market/buy/', {'itemKey': 'meal-street'})
        self.assertEqual(buy_res.status_code, status.HTTP_200_OK)
        buy_data = buy_res.json()
        self.character.refresh_from_db()

        self.assertEqual(self.character.money, initial_money - 5000)
        self.assertEqual(self.character.energy, 60)  # 40 + 20
        self.assertEqual(self.character.wellbeing, 75)  # 70 + 5
        self.assertEqual(buy_data['transaction']['category'], 'Market')

        # 3. Insufficient funds for expensive equipment
        self.character.money = 10000
        self.character.save()
        fail_res = self.client.post('/api/market/buy/', {'itemKey': 'item-laptop'})
        self.assertEqual(fail_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Fonds insuffisants", fail_res.json().get('error', ''))

        # 4. Successful equipment purchase and inventory inclusion
        self.character.money = 300000
        self.character.save()
        equip_res = self.client.post('/api/market/buy/', {'itemKey': 'item-laptop'})
        self.assertEqual(equip_res.status_code, status.HTTP_200_OK)
        self.character.refresh_from_db()
        self.assertIn('item-laptop', self.character.inventory)

        # 5. Prevent duplicate purchase of permanent equipment
        dup_res = self.client.post('/api/market/buy/', {'itemKey': 'item-laptop'})
        self.assertEqual(dup_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("déjà cet équipement", dup_res.json().get('error', ''))

    def test_13_job_interview_simulation_flow(self):
        """Verifies interview simulation, pedagogical criteria scoring, suit bonus, and hiring decision (§8, §22)."""
        # 1. Candidate with insufficient skills fails before interview
        self.character.skills.filter(skill__key='javascript').update(level_percent=20)
        res_fail_req = self.client.post('/api/business/jobs/job-dev-junior/interview/', {'answerIndex': 0})
        self.assertEqual(res_fail_req.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Compétence insuffisante", res_fail_req.json().get('error', ''))

        # Restore skill level
        self.character.skills.filter(skill__key='javascript').update(level_percent=60)

        # 2. Candidate answers poorly (answerIndex 1, score 25) -> not hired
        res_poor = self.client.post('/api/business/jobs/job-dev-junior/interview/', {'answerIndex': 1})
        self.assertEqual(res_poor.status_code, status.HTTP_200_OK)
        data_poor = res_poor.json()
        self.assertFalse(data_poor['hired'])
        self.assertEqual(data_poor['score'], 25)
        self.assertIn('advice', data_poor)
        self.character.refresh_from_db()
        self.assertIsNone(self.character.current_job)

        # 3. Candidate buys professional suit from market -> gets suit bonus (+5%)
        self.character.inventory = ['item-suit']
        self.character.save()
        initial_xp = self.character.xp

        # 4. Candidate gives excellent answer (answerIndex 0, base score 95 + 5 suit bonus = 100) -> hired with +100 XP
        res_good = self.client.post('/api/business/jobs/job-dev-junior/interview/', {'answerIndex': 0})
        self.assertEqual(res_good.status_code, status.HTTP_200_OK)
        data_good = res_good.json()
        self.assertTrue(data_good['hired'])
        self.assertEqual(data_good['score'], 100)
        self.assertEqual(data_good['suitBonus'], 5)
        self.assertGreaterEqual(data_good['thematicScore'], 8)
        self.assertGreaterEqual(data_good['clarityScore'], 8)
        self.assertGreaterEqual(data_good['acquisScore'], 8)

        self.character.refresh_from_db()
        self.assertEqual(self.character.current_job.key, 'job-dev-junior')
        self.assertEqual(self.character.xp, initial_xp + 100)

    def test_14_startup_district_pipeline_flow(self):
        """Verifies entrepreneurial lifecycle: creation, actions, traction, and incubator grant (§12, §24)."""
        # 1. List startup projects
        res_list = self.client.get('/api/startup/projects/')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res_list.json()), 1)

        # 2. Create a new startup venture
        initial_money = self.character.money
        res_create = self.client.post('/api/startup/create/', {
            'name': 'AgriSmart Madagascar',
            'sector': 'agritech',
            'pitch': 'Solutions de capteurs IoT solaires pour optimiser l\'irrigation agricole.',
            'initialCapital': 30000,
        })
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        new_proj = res_create.json()['project']
        self.assertEqual(new_proj['name'], 'AgriSmart Madagascar')
        self.assertEqual(new_proj['sector'], 'agritech')
        self.assertEqual(new_proj['stage'], 'idea')
        self.assertEqual(new_proj['treasury'], 30000)

        self.character.refresh_from_db()
        self.assertEqual(self.character.money, initial_money - 30000)
        proj_key = new_proj['key']

        # 3. Try to claim incubator grant too early -> rejected
        res_early_grant = self.client.post(f'/api/startup/{proj_key}/grant/')
        self.assertEqual(res_early_grant.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Dossier insuffisant", res_early_grant.json().get('error', ''))

        # 4. Advance action: Market study
        res_action1 = self.client.post(f'/api/startup/{proj_key}/action/', {'actionType': 'market_study'})
        self.assertEqual(res_action1.status_code, status.HTTP_200_OK)
        updated_proj = res_action1.json()['project']
        self.assertGreaterEqual(updated_proj['progress'], 40)
        self.assertGreaterEqual(updated_proj['reputation'], 25)

        # 5. Advance action: Develop MVP (treasury has 30,000, requires 25,000)
        res_action2 = self.client.post(f'/api/startup/{proj_key}/action/', {'actionType': 'develop_mvp'})
        self.assertEqual(res_action2.status_code, status.HTTP_200_OK)
        mvp_proj = res_action2.json()['project']
        self.assertEqual(mvp_proj['treasury'], 5000)
        self.assertGreaterEqual(mvp_proj['reputation'], 40)

        # 6. Now claim incubator grant (reputation >= 30%) -> awarded 200,000 MGA!
        res_grant = self.client.post(f'/api/startup/{proj_key}/grant/')
        self.assertEqual(res_grant.status_code, status.HTTP_200_OK)
        grant_proj = res_grant.json()['project']
        self.assertTrue(grant_proj['hasIncubatorGrant'])
        self.assertEqual(grant_proj['treasury'], 205000)
        self.assertIn("bourse d'amorçage", res_grant.json().get('message', ''))




