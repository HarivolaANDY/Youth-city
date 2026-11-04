# ⚙️ Youth City — Backend API & Game Engine

> **Moteur de simulation de vie, API RESTful et système économique en Ariary (MGA), propulsé par Django 6 et Django REST Framework.**

---

## 📖 Sommaire

- [1. Présentation & Responsabilités](#1-présentation--responsabilités)
- [2. Stack Technique](#2-stack-technique)
- [3. Organisation du Code Source](#3-organisation-du-code-source)
- [4. Guide de Démarrage en Développement](#4-guide-de-démarrage-en-développement)
- [5. Base de Données, Migrations & Données Initiales](#5-base-de-données-migrations--données-initiales)
- [6. Tests Automatisés](#6-tests-automatisés)
- [7. Variables d'Environnement](#7-variables-denvironnement)
- [8. Sécurité, Throttling & Sanitisation](#8-sécurité-throttling--sanitisation)
- [9. Liens Utiles](#9-liens-utiles)

---

## 1. Présentation & Responsabilités

Le backend de **Youth City** est le cœur logique et économique de la plateforme. Il expose une API REST complète pour :
- **Gérer le cycle de simulation** : avance du temps par créneaux horaires (*Matin*, *Après-midi*, *Soirée*, *Nuit*), cycle nycthéméral, gestion de l'énergie, de la fatigue et du moral.
- **Simuler l'économie citoyenne (Ariary MGA)** : gestion des comptes bancaires (compte courant, compte d'épargne avec intérêts), loyers résidentiels, rémunération des emplois CDD/CDI et contrats freelance.
- **Piloter les 7 districts du jeu** :
  - `Campus` : catalogue de cours, validation de quiz interactifs et arbre de compétences (*Skill Tree*).
  - `Business` : offres d'emploi, simulations d'entretien d'embauche, shifts de travail et missions freelance.
  - `Residential` : sélection et loyer des logements (colocation, studio, appartement, villa) avec impact sur la récupération d'énergie.
  - `Finance` : dépôts, retraits et historique d'audit des transactions bancaires.
  - `Market` : achat d'articles de consommation et d'équipements productifs.
  - `Startup` : création de projet d'entreprise, passage des 4 jalons (Idéation à Commercialisation) et octroi de subventions d'incubation.
  - `City Hub` : adhésion aux guildes, participation aux hackathons, tableau des scores (*Leaderboard*), annuaire citoyen et messagerie directe.
- **Accompagnement IA adaptatif (NOVA)** : dialogue contextualisé et conseils stratégiques fondés sur l'état temps réel du joueur.
- **Certification & Back-Office** : génération et vérification publique du **Career Passport** numérique, modération des signalements et bourses d'urgence.

---

## 2. Stack Technique

- **Langage & Runtime** : Python 3.12+
- **Framework Web** : Django 6.1 (`Django==6.1.1`)
- **API REST** : Django REST Framework 3.18 (`djangorestframework==3.18.1`)
- **Authentification** : JWT avec SimpleJWT (`djangorestframework_simplejwt==5.5.1`, `PyJWT==2.15.0`)
- **CORS** : `django-cors-headers==4.9.0`
- **Base de Données** :
  - **Développement local & Conteneur standard** : SQLite 3 (`db.sqlite3`)
  - **Pilotes PostgreSQL** : `psycopg==3.3.6` et `psycopg-binary==3.3.6` intégrés pour les déploiements managés
- **Serveur WSGI de Production** : Gunicorn (inclus dans l'image Docker)

---

## 3. Organisation du Code Source

```text
backend/
├── config/                         # Configuration centrale du projet Django
│   ├── __init__.py
│   ├── asgi.py                     # Point d'entrée ASGI
│   ├── settings.py                 # Paramètres Django, sécurité, JWT, rate limiting, CORS
│   ├── openapi.py                  # Hook du schéma OpenAPI (documente uniquement /api/v1/)
│   ├── urls.py                     # Routage racine (admin, /api/v1/, alias /api/ déprécié, docs)
│   └── wsgi.py                     # Point d'entrée WSGI pour Gunicorn
├── game/                           # Application métier centrale du jeu Youth City
│   ├── management/
│   │   └── commands/
│   │       └── seed_game_data.py   # Commande CLI de peuplement initial (catalogue, admin, démo)
│   ├── views/                      # Vues REST, une par district (voir ci-dessous)
│   │   ├── common.py               # Constantes, archétypes et helpers partagés
│   │   ├── game_loop.py            # État, temps, sommeil, réinitialisation
│   │   ├── accounts.py             # Inscription, connexion, profil, création du personnage
│   │   ├── campus.py               # Formations et quiz
│   │   ├── business.py             # Emplois, entretiens, shifts, missions freelance
│   │   ├── finance.py              # Épargne et transactions
│   │   ├── residential.py          # Logements
│   │   ├── market.py               # Achats
│   │   ├── startup.py              # Incubateur et projets
│   │   ├── hub.py                  # Guildes, hackathons, classement, annuaire, messagerie
│   │   ├── dilemmas.py             # Dilemmes et événements aléatoires
│   │   ├── admin_moderation.py     # Back-office, modération, analytics d'impact
│   │   ├── nova.py                 # Mentor IA NOVA
│   │   └── passport.py             # Career Passport et vérification publique
│   ├── admin.py                    # Enregistrement des modèles dans l'interface d'administration
│   ├── api_docs.py                 # Serializers d'entrée et décorateur @document (OpenAPI)
│   ├── apps.py                     # Configuration de l'application Django game
│   ├── models.py                   # Schéma relationnel (Citizen, Skills, Jobs, Housing, etc.)
│   ├── sanitizers.py               # Fonctions d'assainissement textuel strict anti-XSS
│   ├── serializers.py              # Sérialiseurs DRF avec validation des données entrantes
│   ├── test_api_versioning.py      # Tests du versionnement /api/v1/ et du schéma OpenAPI
│   ├── tests.py                    # Suite complète de tests unitaires et d'intégration
│   ├── throttles.py                # Classes de limitation de débit (login, register, chat NOVA)
│   └── urls.py                     # Déclaration des 50+ endpoints REST (/api/v1/*)
├── .env.example                    # Modèle des variables d'environnement
├── Dockerfile                      # Image de production durcie (Python 3.12-slim, non-root 10001)
├── manage.py                       # CLI d'administration Django
└── requirements.txt                # Dépendances Python épinglées
```

---

## 4. Guide de Démarrage en Développement

### Prérequis
- **Python** : version 3.12 ou supérieure
- Outils standards : `pip` et module `venv`

### Procédure d'Installation

1. **Se placer dans le répertoire backend :**
   ```bash
   cd backend
   ```

2. **Créer et activer l'environnement virtuel :**
   - **Sur Windows (PowerShell) :**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **Sur Linux / macOS :**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Installer les dépendances requises :**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configurer les variables d'environnement :**
   Copiez le fichier d'exemple pour initialiser votre configuration locale :
   ```bash
   cp .env.example .env
   ```
   *Les valeurs par défaut conviennent pour le développement local (`DJANGO_DEBUG=True`).*

5. **Appliquer les migrations de base de données :**
   ```bash
   python manage.py migrate
   ```

6. **Peupler la base de données avec le catalogue de jeu :**
   ```bash
   python manage.py seed_game_data --demo-citizen
   ```
   > 💡 Cette commande initialise les logements, les cours, les métiers, les articles du marché, les hackathons, le personnage de démonstration (*Emmanuel*) ainsi que le compte administrateur initial (`admin` / `admin@youthcity.mg`).

7. **Lancer le serveur de développement :**
   ```bash
   python manage.py runserver 8000
   ```
   L'API est accessible sur **`http://localhost:8000/api/v1/`**, la documentation interactive (Swagger) sur **`http://localhost:8000/api/v1/docs/`** et l'interface d'administration sur **`http://localhost:8000/admin/`**.

### Versionnement & Documentation de l'API

| URL | Rôle |
| :--- | :--- |
| `/api/v1/...` | **Version courante**, à utiliser pour tout nouveau client (le frontend l'utilise par défaut). |
| `/api/...` | Alias historique de la v1, conservé pour la compatibilité des clients existants. **Déprécié** : il sera retiré à l'arrivée d'une v2. |
| `/api/v1/schema/` | Schéma OpenAPI 3 (YAML/JSON), généré par `drf-spectacular`. |
| `/api/v1/docs/` | Interface Swagger UI. |

- Le schéma et Swagger ne sont exposés qu'en mode `DJANGO_DEBUG=True`. Pour les activer ailleurs (recette), définir `DJANGO_ENABLE_API_DOCS=True`.
- Exporter le schéma dans un fichier (utile pour générer des types TypeScript) : `python manage.py spectacular --file openapi.yml`.
- Pour documenter une nouvelle vue, décorez-la avec `@document(tag, résumé, request=..., response=...)` (voir [`game/api_docs.py`](game/api_docs.py)), au-dessus de `@api_view`.

---

## 5. Base de Données, Migrations & Données Initiales

### Modèle Relationnel
L'application s'appuie sur des modèles interconnectés définis dans [`game/models.py`](game/models.py) :
- `Character` (ou Citoyen) : identité, argent liquide, solde d'épargne, jauges d'énergie/moral, créneau horaire, réputation, logement actuel, emploi actuel.
- `Skill` & `CharacterSkill` : compétences acquises et niveaux de maîtrise.
- `Course` & `Certification` : modules éducatifs validés par quiz et certificats délivrés.
- `Job` & `FreelanceGig` : opportunités professionnelles avec exigences de compétences.
- `Property` : parc résidentiel avec confort et régénération d'énergie.
- `MarketItem` : catalogue d'objets marchands.
- `StartupProject` : projets de création d'entreprise avec jalons et subventions.
- `Guild`, `Hackathon`, `CitizenMessage`, `ModerationReport` : interactions communautaires.

### Commandes Utiles
```bash
# Créer de nouvelles migrations après modification de models.py
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Réinitialiser ou peupler le jeu avec les données d'origine
python manage.py seed_game_data --demo-citizen

# Créer un compte administrateur Django interactif
python manage.py createsuperuser
```

---

## 6. Tests Automatisés

Le backend inclut une suite de tests unitaires et d'intégration validant le bon fonctionnement de tous les endpoints d'API, de l'authentification et de la logique métier de la simulation :

```bash
python manage.py test
```

*Résultat attendu : exécution avec succès des **25 tests** sans aucune erreur ni régression.*

---

## 7. Variables d'Environnement

Le fichier `.env` à la racine de `backend/` (chargé nativement par `settings.py`) supporte les paramètres suivants :

| Variable | Type | Description | Valeur par défaut |
| :--- | :--- | :--- | :--- |
| `DJANGO_SECRET_KEY` | Chaîne | Clé de chiffrement cryptographique de Django. | Clé de dev interne |
| `DJANGO_DEBUG` | Booléen | Active ou désactive le mode débogage. | `True` |
| `DJANGO_ALLOWED_HOSTS` | Liste (CSV) | Noms d'hôtes ou adresses IP autorisés. | `localhost,127.0.0.1,[::1]` |
| `CORS_ALLOWED_ORIGINS` | Liste (CSV) | Origines HTTP frontend autorisées pour le CORS. | `http://localhost:5173,http://127.0.0.1:5173` |
| `DJANGO_ADMIN_PASSWORD` | Chaîne | Mot de passe du superutilisateur créé par `seed_game_data`. | Aucun hors `DJANGO_DEBUG=True` (dev : `YouthCityAdmin2026!`). Obligatoire en production. |
| `DJANGO_NUM_PROXIES` | Entier | Nombre de proxys amont pour le calcul de l'IP cliente (`X-Forwarded-For`). | `1` |
| `DJANGO_SECURE_SSL_REDIRECT` | Booléen | Force la redirection automatique de tout le trafic vers HTTPS. | `False` |
| `DJANGO_SESSION_COOKIE_SECURE`| Booléen | Active le flag `Secure` sur les cookies de session. | `False` |
| `DJANGO_CSRF_COOKIE_SECURE` | Booléen | Active le flag `Secure` sur les cookies CSRF. | `False` |
| `DJANGO_SECURE_HSTS_SECONDS` | Entier | Durée d'application du header HSTS (HTTP Strict Transport Security). | `31536000` (1 an) |

---

## 8. Sécurité, Throttling & Sanitisation

Le backend est conçu selon les standards **OWASP ASVS** et applique une politique de défense en profondeur :
- **Fail-Closed en Production** : Lorsque `DJANGO_DEBUG=False`, l'application refuse impérativement de démarrer si `DJANGO_SECRET_KEY` est absente, non modifiée ou fait moins de 32 caractères.
- **Limitation de Débit (Throttling DRF)** :
  - `auth_login` : 10 requêtes/minute par IP.
  - `auth_register` : 5 requêtes/minute par IP.
  - `nova_chat` : 20 requêtes/minute par utilisateur pour parer à la saturation d'API.
- **Assainissement Textuel (`game/sanitizers.py`)** : Nettoyage systématique des caractères invisibles, balises HTML et séquences suspectes sur les entrées utilisateurs (messages, noms, bio, chat NOVA).
- **Conteneur Non-Root (`Dockerfile`)** : Le conteneur s'exécute avec le compte système `appuser:10001` sans élévation de privilèges (`no-new-privileges`).

---

## 9. Liens Utiles

- 🏠 **[README Racine du Projet](../README.md)** : vue d'ensemble du projet et démarrage avec Docker Compose.
- 📱 **[README Frontend](../frontend/README.md)** : documentation de l'application client React 19 et Vite.
- 🛡️ **[Politique de Sécurité](../SECURITY.md)** : procédure de signalement et architecture de sécurité détaillée.
- 📋 **[Cahier des Charges](../docs/cahier-des-charges.md)** : spécifications fonctionnelles du projet.
