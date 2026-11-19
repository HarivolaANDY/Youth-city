"""Tests du choix de base de données (OPS-07) : PostgreSQL obligatoire en production."""
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase

from config.database import database_from_url, resolve_databases


class DatabaseFromUrlTests(SimpleTestCase):
    def test_parse_une_url_postgresql_complete(self):
        config = database_from_url('postgresql://youth:s3cret@db:5433/youthcity?sslmode=require')
        self.assertEqual(config['ENGINE'], 'django.db.backends.postgresql')
        self.assertEqual(
            (config['NAME'], config['USER'], config['PASSWORD'], config['HOST'], config['PORT']),
            ('youthcity', 'youth', 's3cret', 'db', '5433'),
        )
        self.assertEqual(config['OPTIONS'], {'sslmode': 'require'})
        self.assertTrue(config['CONN_HEALTH_CHECKS'])

    def test_decode_les_caracteres_speciaux_du_mot_de_passe(self):
        config = database_from_url('postgres://youth:p%40ss%2Fw%3Ard@db/youthcity')
        self.assertEqual(config['PASSWORD'], 'p@ss/w:rd')
        self.assertEqual(config['PORT'], '5432')
        self.assertNotIn('OPTIONS', config)

    def test_refuse_un_schema_non_postgresql(self):
        with self.assertRaises(ImproperlyConfigured):
            database_from_url('mysql://youth:x@db/youthcity')

    def test_refuse_une_url_sans_hote_ou_sans_base(self):
        for url in ('postgresql:///youthcity', 'postgresql://youth:x@db/'):
            with self.subTest(url=url), self.assertRaises(ImproperlyConfigured):
                database_from_url(url)


class ResolveDatabasesTests(SimpleTestCase):
    def test_la_production_echoue_sans_database_url(self):
        with self.assertRaisesMessage(ImproperlyConfigured, 'DATABASE_URL est obligatoire'):
            resolve_databases(debug=False, url=None, sqlite_path='db.sqlite3')

    def test_la_production_refuse_aussi_une_url_vide(self):
        with self.assertRaises(ImproperlyConfigured):
            resolve_databases(debug=False, url='', sqlite_path='db.sqlite3')

    def test_le_developpement_utilise_sqlite_par_defaut(self):
        databases = resolve_databases(debug=True, url=None, sqlite_path='/tmp/dev.sqlite3')
        self.assertEqual(databases['default'], {'ENGINE': 'django.db.backends.sqlite3', 'NAME': '/tmp/dev.sqlite3'})

    def test_database_url_prime_sur_sqlite_meme_en_developpement(self):
        databases = resolve_databases(debug=True, url='postgresql://u:p@db/youth', sqlite_path='x')
        self.assertEqual(databases['default']['ENGINE'], 'django.db.backends.postgresql')
