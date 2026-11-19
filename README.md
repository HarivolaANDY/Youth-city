# 🏙️ Youth City

> **Plateforme web interactive et gamifiée de simulation de vie, d'insertion professionnelle et d'apprentissage expérientiel pour jeunes adultes.**  
> *« Apprends la vie. Construis ton avenir. »*

## 📖 Sommaire

- [1. À Propos du Projet](#1-à-propos-du-projet)
  - [Vision & Philosophie](#vision--philosophie)
  - [Contexte Économique & Monnaie (Ariary MGA)](#contexte-économique--monnaie-ariary-mga)
- [2. Fonctionnalités & Districts de la Ville](#2-fonctionnalités--districts-de-la-ville)
- [3. Architecture & Technologies](#3-architecture--technologies)
- [4. Prérequis Système](#4-prérequis-système)
- [5. Guide de Démarrage en Développement Local](#5-guide-de-démarrage-en-développement-local)
  - [0. Cloner le dépôt](#0-cloner-le-dépôt)
  - [A. Démarrage du Backend (Django DRF)](#a-démarrage-du-backend-django-drf)
  - [B. Démarrage du Frontend (React + Vite)](#b-démarrage-du-frontend-react--vite)
- [6. Démarrage avec Docker Compose (Environnement Complet)](#6-démarrage-avec-docker-compose-environnement-complet)
- [7. Variables d'Environnement](#7-variables-denvironnement)
- [8. Tests & Validation du Code](#8-tests--validation-du-code)
- [9. Structure du Répertoire](#9-structure-du-répertoire)
- [10. Guides Dédiés & Liens Utiles](#10-guides-dédiés--liens-utiles)
- [11. Sécurité & Modération](#11-sécurité--modération)

---

## 1. À Propos du Projet

### Vision & Philosophie
**Youth City** est une simulation immersive conçue pour accompagner les jeunes adultes (15-30 ans : lycéens, étudiants, jeunes actifs et entrepreneurs) dans leur transition vers l'autonomie citoyenne, financière et professionnelle.

À travers une ville virtuelle interactive, l'utilisateur prend des décisions concrètes :
- Trouver un emploi, réaliser des shifts de travail et des missions freelance.
- Se former, acquérir des compétences concrètes et passer des certifications.
- Gérer son budget quotidien, payer son loyer, épargner et investir.
- Lancer et faire grandir sa propre startup dans un incubateur.
- Prendre part à la vie communautaire (guildes, hackathons, messagerie entre citoyens).
- Être conseillé en continu par un mentor IA adaptatif (**NOVA**).
- Valoriser ses acquis réels via un **Career Passport** numérique vérifiable publiquement.

### Contexte Économique & Monnaie (Ariary MGA)
Le jeu intègre une économie basée sur l'**Ariary malgache (MGA)** afin de contextualiser les ordres de grandeur financiers réels :
- **Budget de départ** : Réserve de trésorerie pour démarrer sa vie citoyenne.
- **Compte Courant & Compte d'Épargne** : Gestion des dépenses courantes et constitution d'intérêts sur l'épargne.
- **Gestion des Risques & Charges** : Loyers hebdomadaires/mensuels, imprévus de santé ou dilemmes financiers.

---

## 2. Fonctionnalités & Districts de la Ville

La ville est organisée en **7 quartiers spécialisés**, interconnectés à un moteur de simulation dynamique :

| District | Rôle & Mécaniques |
| :--- | :--- |
| 🎓 **Campus District** | Formations interactives (Finance, Code, Soft Skills, Entrepreneuriat), quiz de validation, arbre de compétences (*Skill Tree*) et délivrance de certifications officielles. |
| 💼 **Business District** | Offres d'emploi (CDD, CDI), entretiens d'embauche simulés, exécution de shifts de travail rémunérés et tableau de missions Freelance avec contrats et livrables. |
| 🏠 **Residential District** | Parc locatif (chambres en colocation, studios, appartements). Le niveau de confort du logement influe sur la vitesse de régénération de l'énergie lors du repos. |
| 🏦 **Finance District** | Établissement bancaire central : virements vers le compte d'épargne, retraits vers le compte courant, et suivi des transactions financières auditables. |
| 🛒 **Market District** | Magasins pour acheter des biens de consommation, équipements informatiques et objets de bien-être pour restaurer sa jauge d'énergie et optimiser sa productivité. |
| 🚀 **Startup District** | Incubateur de projets entrepreneuriaux : création de projet, franchissement des jalons (Idéation, MVP, Pitch Deck, Commercialisation) et demande de subventions de démarrage. |
| 🏛️ **City Hub** | Place publique : adhésion aux guildes thématiques, participation aux hackathons citoyens, classement général (*Leaderboard*), annuaire des citoyens et messagerie directe. |

### Moteur de Jeu & Modules Transversaux
- **Cycle Nycthéméral & Énergie** : Gestion des créneaux horaires de la journée (*Matin*, *Après-midi*, *Soirée*, *Nuit*), avance du temps, cycle de sommeil et gestion de la fatigue.
- **Dilemmes & Événements Aléatoires** : Choix éthiques, opportunités impromptues et imprévus financiers avec impact direct sur la réputation, l'énergie et le portefeuille.
- **Mentor IA NOVA** : Conseiller virtuel capable de suggérer la prochaine action stratégique la plus pertinente et de dialoguer en temps réel avec le joueur.
- **Career Passport** : Passeport citoyen exportable et vérifiable via un code unique (`/api/v1/passport/verify/<code_unique>/`).
- **Back-Office d'Administration & Modération** : Supervision des métriques d'impact, octroi de bourses/stipends d'urgence, et traitement des signalements citoyens.

---

## 3. Architecture & Technologies

Le projet s'appuie sur une architecture découplée, réactive et sécurisée :

```
                  ┌──────────────────────────────────────────────┐
                  │          Client Web (Navigateur)             │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTP / REST
                                         ▼
                 ┌────────────────────────────────────────────────┐
                 │       Serveur Nginx (Port 80 en Prod)          │
                 │   - Serveur de fichiers statiques (React)      │
                 │   - Reverse Proxy vers l'API (/api/*)          │
                 │   - En-têtes de sécurité (CSP, HSTS, CORS)     │
                 └───────────────────────┬────────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
┌───────────────────────────────────────┐   ┌─────────────────────────────────────┐
│           Frontend (Vite Dev)         │   │          Backend (Django DRF)       │
│ - React 19 + TypeScript               │   │ - Django 6 & Django REST Framework  │
│ - Tailwind CSS v4                     │   │ - Authentification JWT (SimpleJWT)  │
│ - Zustand (State Management)          │   │ - Moteur de simulation de jeu       │
│ - Lucide React & Canvas-Confetti      │   │ - SQLite 3 (Dev/Docker) + psycopg 3 │
│ - Proxy Vite /api -> :8000            │   │ - Gunicorn (WSGI Server)            │
└───────────────────────────────────────┘   └─────────────────────────────────────┘
```

> **Base de données** : SQLite (`db.sqlite3`) en développement ; **PostgreSQL obligatoire en production** (`DJANGO_DEBUG=False` sans `DATABASE_URL` : Django refuse de démarrer). `docker compose up` fournit PostgreSQL, un volume persistant et une sauvegarde quotidienne. Exploitation, sauvegarde et restauration : [docs/exploitation-base-de-donnees.md](docs/exploitation-base-de-donnees.md).

---

## 4. Prérequis Système

Assurez-vous d'avoir installé sur votre machine :
- **Node.js** : version 20 LTS ou supérieure (Node 22 recommandé) avec `npm`.
- **Python** : version 3.12 ou supérieure avec `pip` et `venv`.
- **Git** : pour le clonage et le versionnement.
- *(Optionnel mais recommandé pour la production)* : **Docker** & **Docker Compose**.

---

## 5. Guide de Démarrage en Développement Local

Pour exécuter le projet en local avec rechargement à chaud (Hot Module Reload) pour le frontend et le backend :

### 0. Cloner le dépôt

```bash
git clone <url-du-depot> "Youth City"
cd "Youth City"
```
> Remplacez `<url-du-depot>` par l'URL de votre dépôt Git. Les commandes suivantes partent de ce dossier racine (le clonage vaut aussi pour la section Docker).

### A. Démarrage du Backend (Django DRF)

1. **Ouvrir un terminal et se placer dans le répertoire du backend :**
   ```bash
   cd backend
   ```

2. **Créer et activer l'environnement virtuel Python :**
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

3. **Installer les dépendances Python :**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configurer l'environnement :**
   Copiez le modèle d'environnement (`copy .env.example .env` sous Windows cmd, `Copy-Item .env.example .env` sous PowerShell) :
   ```bash
   cp .env.example .env
   ```
   *En développement, les valeurs de `backend/.env.example` fonctionnent telles quelles (`DJANGO_DEBUG=True` et une clé de développement). Ne les réutilisez jamais en production.*

5. **Appliquer les migrations de base de données :**
   ```bash
   python manage.py migrate
   ```

6. **Peupler la base de données avec les données initiales du jeu (Seed Data) :**
   Cette commande crée le catalogue initial (formations, emplois, logements, articles du marché, hackathons, bourses et le personnage de démonstration *Emmanuel*) :
   ```bash
   python manage.py seed_game_data --demo-citizen
   ```
   > ℹ️ **Catalogue vs. données de démonstration** : `seed_game_data` crée toujours le catalogue (logements, compétences, formations, emplois, marché, dilemmes, guildes, hackathons, badges). L'option `--demo-citizen` ajoute en plus le citoyen de démonstration *Emmanuel* et ses données d'exemple : **à réserver au développement**. Sans cette option (cas de Docker et de la production), aucun personnage de démonstration n'est créé.
   > 🔐 **Authentification obligatoire** : il n'y a plus de personnage partagé pour les visiteurs anonymes. Seuls les catalogues publics (formations, offres d'emploi, logements), l'inscription/connexion, la vérification publique d'un passeport et `/api/v1/health/` sont accessibles sans compte. Créez un compte depuis l'interface (ou via `/api/v1/auth/register/`) pour jouer.
   > ℹ️ **Compte d'administration** : `seed_game_data` crée un superutilisateur (`admin` / `admin@youthcity.mg`) si aucun n'existe, avec le mot de passe de `DJANGO_ADMIN_PASSWORD`. En mode `DJANGO_DEBUG=True` seulement, un mot de passe de développement public (`YouthCityAdmin2026!`) est utilisé si la variable est absente ; **hors DEBUG, aucun administrateur n'est créé sans `DJANGO_ADMIN_PASSWORD`**.

7. **(Optionnel) Créer un compte administrateur Django personnalisé :**
   ```bash
   python manage.py createsuperuser
   ```

8. **Lancer le serveur de développement backend :**
   ```bash
   python manage.py runserver 8000
   ```
   > 🚀 L'API Django est désormais accessible sur : **`http://localhost:8000/api/v1/`**  
   > 📘 Documentation interactive de l'API (Swagger, en mode debug) : **`http://localhost:8000/api/v1/docs/`**  
   > L'interface d'administration Django est accessible sur : **`http://localhost:8000/admin/`**

---

### B. Démarrage du Frontend (React + Vite)

1. **Ouvrir un second terminal et se placer dans le dossier frontend :**
   ```bash
   cd frontend
   ```

2. **Installer les dépendances Node.js :**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement Vite :**
   ```bash
   npm run dev
   ```

4. **Accéder à l'application :**
   > 🌐 Ouvrez votre navigateur sur : **`http://localhost:5173`**  
   > *Le serveur Vite est préconfiguré pour relayer automatiquement tous les appels vers `/api/*` sur `http://localhost:8000` via son proxy interne.*

---

## 6. Démarrage avec Docker Compose (Environnement Complet)

Pour lancer la totalité de la stack (Frontend Nginx + Backend Gunicorn) dans des conteneurs isolés et sécurisés :

1. **Prérequis de sécurité obligatoire :**
   Docker Compose impose la présence de `DJANGO_SECRET_KEY` (conformité OWASP Fail-Closed). Cette variable est lue dans le fichier **`.env` à la racine du projet** (et non dans `backend/.env`). Depuis la racine :
   ```bash
   cp .env.example .env
   ```
   Générez ensuite une clé aléatoire :
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```
   et collez-la dans `.env` : `DJANGO_SECRET_KEY=<la-cle-generee>` (32 caractères minimum). Sans clé valide, le démarrage échoue volontairement.

2. **À la racine du projet, exécuter la commande de build et démarrage :**
   ```bash
   docker compose up --build
   ```
   > ℹ️ Au démarrage, le conteneur backend exécute automatiquement `migrate` puis `seed_game_data` : inutile de les lancer à la main. Le compte `admin` est créé comme décrit en section 5 (pensez à définir `DJANGO_ADMIN_PASSWORD` dans `.env`).

3. **Points d'accès :**
   - **Application Web complète** : `http://localhost:80`
   - **API REST Backend** : `http://localhost:8000/api/v1/`
   - **Santé du service (Healthcheck, public)** : `http://localhost:8000/api/v1/health/`
   - **Documentation Swagger** : désactivée par défaut en mode non-debug (voir `DJANGO_ENABLE_API_DOCS` ci-dessous)

4. **Pour arrêter la stack :**
   ```bash
   docker compose down
   ```

---

## 7. Variables d'Environnement

Le backend lit ses variables depuis `backend/.env` ou l'environnement système :

| Variable | Description | Valeur par défaut | Production |
| :--- | :--- | :--- | :--- |
| `DJANGO_SECRET_KEY` | Clé secrète de cryptographie Django | Clé de dev interne | **Obligatoire (min. 32 car.)** |
| `DJANGO_DEBUG` | Mode débogage Django | `True` | `False` |
| `DJANGO_ENABLE_API_DOCS` | Expose le schéma OpenAPI et Swagger (`/api/v1/docs/`) hors mode debug | `False` (actif si `DJANGO_DEBUG=True`) | `False` (ou `True` en recette) |
| `DJANGO_ALLOWED_HOSTS` | Hôtes autorisés (séparés par virgule) | `localhost,127.0.0.1,[::1]` | Domaines / IP de prod |
| `CORS_ALLOWED_ORIGINS` | Origines HTTP autorisées pour le CORS | `http://localhost:5173` | Domaines frontend de prod |
| `DJANGO_ADMIN_PASSWORD` | Mot de passe admin créé par `seed_game_data` | `YouthCityAdmin2026!` (uniquement si `DJANGO_DEBUG=True`) | **Obligatoire** : sans elle, aucun administrateur n'est créé |
| `DJANGO_NUM_PROXIES` | Nombre de proxys amont pour IP cliente (DRF) | `1` | `1` (ou selon infrastructure) |
| `DJANGO_SECURE_SSL_REDIRECT` | Redirection automatique vers HTTPS | `False` | `True` |
| `DJANGO_SESSION_COOKIE_SECURE` | Cookies de session en `Secure` | `False` | `True` |
| `DJANGO_CSRF_COOKIE_SECURE` | Cookies CSRF en `Secure` | `False` | `True` |
| `DJANGO_SECURE_HSTS_SECONDS` | Durée HSTS si SSL redirect actif | `31536000` | `31536000` (1 an) |

---

### Mentor IA NOVA (optionnel)

Par défaut, NOVA répond avec des règles locales (gratuit, sans réseau). Pour brancher un modèle Claude :

```bash
cd backend
pip install -r requirements-ai.txt
```

puis, côté serveur uniquement : `NOVA_AI_PROVIDER=anthropic`, `ANTHROPIC_API_KEY=...` et, si besoin, `NOVA_AI_MODEL` (par défaut `claude-opus-5-5` ; `claude-sonnet-5-5` ou `claude-haiku-5-5` réduisent le coût). En cas d'erreur, de refus ou d'absence de clé, NOVA retombe automatiquement sur les règles locales. L'IA ne produit que du texte et n'a aucune action sur le jeu ; les échanges sont limités à 20 par minute et 200 par jour et par compte.

### Protection des mineurs et confidentialité

L'inscription demande l'année de naissance et l'acceptation des conditions ; les moins de 18 ans déclarent l'accord de leur représentant légal. Mineurs et adultes ne se voient pas dans l'annuaire/classements et ne s'écrivent pas. Les seuils (13 et 18 ans) sont à valider par la revue juridique prévue au cahier des charges (§31.1, §48.2).

---

## 8. Tests & Validation du Code

### Tests Unitaires & d'Intégration du Backend
Le backend dispose d'une suite complète de plus de 900 lignes de tests automatisés couvrant tous les endpoints et la logique métier :
```bash
cd backend
python manage.py test
```

### Linting & Compilation du Frontend
Pour vérifier les types TypeScript et valider la conformité du code frontend :
```bash
cd frontend
# Vérification du code avec Oxlint
npm run lint

# Validation des types et compilation de production
npm run build
```

---

## 9. Structure du Répertoire

```text
Youth City/
├── docs/                           # Documentation et spécifications fonctionnelles du projet
│   ├── cahier-des-charges.md       # Cahier des charges de référence (v1.2 : 47 sections + §48 décisions de mise en œuvre + §49 maintenabilité et qualité)
│   └── cahier-des-charges.legacy-v0.md  # Ancienne version (§1-57) sur laquelle le code avait été écrit : références « §N » du code
├── backend/                        # Backend Django REST Framework (voir backend/README.md)
│   ├── config/                     # Configuration Django (settings, urls, wsgi)
│   ├── game/                       # Application centrale du jeu
│   │   ├── management/commands/    # Scripts de peuplement (seed_game_data.py)
│   │   ├── models.py               # Schéma relationnel (Citizen, Jobs, Courses, etc.)
│   │   ├── views/                  # Contrôleurs API REST, un module par district (campus, business, hub…)
│   │   ├── api_docs.py             # Documentation OpenAPI des endpoints (Swagger)
│   │   ├── serializers.py          # Sérialiseurs DRF avec validation stricte
│   │   ├── sanitizers.py           # Assainissement des données textuelles entrantes
│   │   ├── throttles.py            # Limitation du débit (Rate limiting)
│   │   ├── tests.py                # Suite de tests d'intégration API
│   │   └── urls.py                 # Routage des endpoints REST
│   ├── Dockerfile                  # Image Docker backend durcie (non-root)
│   ├── requirements.txt            # Dépendances Python
│   ├── manage.py                   # CLI Django
│   └── README.md                   # Guide technique dédié du backend
├── frontend/                       # Application React 19 & Vite (voir frontend/README.md)
│   ├── src/
│   │   ├── components/             # Composants d'interface (Navbar, Modales, Layout)
│   │   ├── data/                   # Données statiques et constantes de fallback
│   │   ├── features/               # Modules métiers par district (Campus, Career, Hub, etc.)
│   │   ├── lib/                    # Utilitaires transversaux (formatteurs monétaires MGA)
│   │   ├── services/               # Client API avec gestion et rotation des tokens JWT
│   │   ├── stores/                 # Store Zustand centralisé (useGameStore.ts)
│   │   ├── types/                  # Définitions TypeScript complètes du modèle
│   │   ├── App.tsx                 # Composant racine
│   │   ├── main.tsx                # Point d'entrée React
│   │   └── index.css               # Styles globaux Tailwind CSS v4
│   ├── Dockerfile                  # Image Docker multi-stage (Node.js -> Nginx)
│   ├── nginx.conf                  # Configuration Nginx de production avec en-têtes CSP
│   ├── package.json                # Dépendances et scripts frontend
│   ├── vite.config.ts              # Configuration Vite avec reverse proxy /api
│   └── README.md                   # Guide technique dédié du frontend
├── docker-compose.yml              # Orchestration multi-conteneurs sécurisée
├── SECURITY.md                     # Politique de sécurité & cartographie OWASP
└── README.md                       # Guide officiel du projet (ce fichier)
```

---

## 10. Guides Dédiés & Liens Utiles

Pour approfondir le fonctionnement de chaque brique du projet, consultez les documentations spécialisées :
- 📱 **[Documentation Frontend](frontend/README.md)** : architecture React 19, gestion des vues par district, store Zustand et client API.
- ⚙️ **[Documentation Backend](backend/README.md)** : architecture Django DRF, modèles du jeu, endpoints de simulation, seed et tests.
- 📋 **[Cahier des Charges](docs/cahier-des-charges.md)** : spécifications fonctionnelles, parcours utilisateurs, règles économiques et matrice d'impact.
- 🛡️ **[Politique de Sécurité & Audit OWASP](SECURITY.md)** : procédures de divulgation responsable, remédiations P1-P5 et durcissement.

---

## 11. Sécurité & Modération

Le projet applique les principes de sécurité par défaut (**Secure-by-Design**, conforme OWASP ASVS) :
- **Authentification JWT Robuste** : Utilisation de tokens d'accès courts avec refresh tokens sécurisés.
- **Sanitisation & Validation Stricte** : Nettoyage systématique du contenu utilisateur contre les failles XSS et injections.
- **Rate Limiting** : Protection des endpoints sensibles (authentification, messagerie, chat IA) contre les attaques par force brute.
- **Conteneurs Non-Root** : Exécution des processus applicatifs sous des identifiants système non privilégiés (`appuser:10001`).
- **En-têtes HTTP Durcis** : Content Security Policy (CSP), HSTS, protection XSS, et isolement de cadres (*Clickjacking protection*).

Pour signaler une vulnérabilité ou consulter la politique de sécurité complète, référez-vous au document [SECURITY.md](SECURITY.md).

---

*Youth City — Développé avec passion pour l'autonomie et l'émancipation des jeunes générations.*
