# 📱 Youth City — Frontend Web Client

> **Application web Single-Page (SPA) interactive et gamifiée de Youth City, développée avec React 19, TypeScript, Vite et Tailwind CSS v4.**

---

## 📖 Sommaire

- [1. Présentation & Rôle](#1-présentation--rôle)
- [2. Stack Technique](#2-stack-technique)
- [3. Organisation du Code Source](#3-organisation-du-code-source)
- [4. Guide de Démarrage en Développement](#4-guide-de-démarrage-en-développement)
- [5. Scripts Disponibles](#5-scripts-disponibles)
- [6. Communication avec le Backend & Proxy API](#6-communication-avec-le-backend--proxy-api)
- [7. Production & Serveur Nginx](#7-production--serveur-nginx)
- [8. Liens Utiles](#8-liens-utiles)

---

## 1. Présentation & Rôle

Le frontend de **Youth City** offre une interface utilisateur réactive, fluide et immersive simulant la vie citoyenne, économique et professionnelle dans une ville virtuelle.

L'application gère :
- L'exploration visuelle de la ville via une carte interactive des **7 districts**.
- Le tableau de bord dynamique du citoyen (jauges d'énergie, de moral, trésorerie en **Ariary MGA**, réputation).
- Les interactions métier : formations et quiz du Campus, candidatures et shifts du Business District, gestion bancaire, parc locatif, incubateur de startups, vie citoyenne (guildes, hackathons, messagerie) et mentorat IA NOVA.
- La génération et l'export du **Career Passport** numérique avec feuille de style dédiée pour l'impression.

---

## 2. Stack Technique

- **Framework UI** : React 19 (`react`, `react-dom`)
- **Langage** : TypeScript 6 (`typescript`, typage strict sans `any`)
- **Outil de Build & HMR** : Vite 8 (`vite`, `@vitejs/plugin-react`)
- **Styles & Design** : Tailwind CSS v4 (`@tailwindcss/vite`, `tailwindcss`)
- **Gestion d'État Global** : Zustand 5 (`useGameStore.ts`)
- **Icônes & Visuels** : Lucide React (`lucide-react`)
- **Animations & Gamification** : Canvas-Confetti (`canvas-confetti`)
- **Qualité & Linting** : Oxlint (`oxlint`)

---

## 3. Organisation du Code Source

```text
frontend/
├── src/
│   ├── components/                 # Composants d'interface partagés
│   │   ├── ui/                     # Primitives d'interface (boutons, badges, modales)
│   │   ├── CharacterModal.tsx      # Personnalisation et création du citoyen
│   │   ├── DilemmaModal.tsx        # Résolution des dilemmes éthiques et financiers
│   │   ├── Navbar.tsx              # Barre de navigation supérieure et statut citoyen
│   │   └── Toast.tsx               # Système de notifications instantanées
│   ├── data/                       # Données initiales et état de fallback hors-ligne
│   │   └── mockData.ts             # Données mockées alignées sur l'API backend
│   ├── features/                   # Modules fonctionnels par district de la ville
│   │   ├── campus/                 # CampusView : cours, quiz interactifs, skill tree
│   │   ├── career/                 # CareerView : emplois, entretiens, shifts, freelance
│   │   ├── city/                   # CityMap : carte interactive des districts
│   │   ├── dashboard/              # DashboardView : synthèse des indicateurs citoyens
│   │   ├── finance/                # FinanceView : banque, comptes épargne/courant
│   │   ├── hub/                    # CityHubView : guildes, hackathons, classement, chat
│   │   ├── market/                 # MarketView : boutique d'achats et consommables
│   │   ├── passport/               # CareerPassportView : passeport certifié imprimable
│   │   ├── residential/            # ResidentialView : parc locatif et logements
│   │   └── startup/                # StartupView : incubateur, projets et bourses
│   ├── lib/                        # Utilitaires transversaux
│   │   └── format.ts               # Formatage monétaire en Ariary (MGA), dates et nombres
│   ├── services/                   # Communication réseau
│   │   └── api.ts                  # Client HTTP avec injection et refresh JWT automatique
│   ├── stores/                     # Store Zustand réactif
│   │   └── useGameStore.ts         # État centralisé (citoyen, cycle jour/nuit, navigation, auth)
│   ├── types/                      # Contrats d'interface TypeScript
│   │   └── game.ts                 # Types stricts partagés pour l'ensemble du jeu
│   ├── App.tsx                     # Composant racine orchestrant le routage par onglet
│   ├── main.tsx                    # Point d'entrée React 19 avec StrictMode
│   └── index.css                   # Directive d'import Tailwind CSS v4
├── Dockerfile                      # Image de production multi-stage (Node.js -> Nginx)
├── nginx.conf                      # Configuration Nginx durcie (CSP, proxy /api, SPA)
├── package.json                    # Dépendances et scripts npm
├── tsconfig.json                   # Configuration du compilateur TypeScript
└── vite.config.ts                  # Configuration du bundler Vite, chunks et proxy API
```

---

## 4. Guide de Démarrage en Développement

### Prérequis
- **Node.js** : version 20 LTS ou supérieure (Node 22 recommandé)
- **npm** : inclus avec Node.js

### Installation et Lancement

1. **Se placer dans le répertoire frontend :**
   ```bash
   cd frontend
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement :**
   ```bash
   npm run dev
   ```

4. **Accéder à l'application :**
   Ouvrez votre navigateur sur **`http://localhost:5173`**.

---

## 5. Scripts Disponibles

Dans le fichier `package.json`, les commandes suivantes sont déclarées :

| Commande | Action |
| :--- | :--- |
| `npm run dev` | Lance le serveur de développement Vite avec Hot Module Replacement (HMR) sur le port 5173. |
| `npm run build` | Vérifie les types avec `tsc -b` puis compile les artefacts optimisés de production dans `dist/`. |
| `npm run lint` | Exécute Oxlint pour analyser la conformité et la sécurité du code TypeScript/React. |
| `npm run preview` | Démarre un serveur local servant les fichiers compilés du dossier `dist/` pour test avant déploiement. |

---

## 6. Communication avec le Backend & Proxy API

- **Proxy Vite en Développement** :  
  Le fichier `vite.config.ts` configure un proxy inverse pour toutes les requêtes dirigées vers `/api` :
  ```typescript
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  }
  ```
  Ainsi, le frontend communique avec l'API Django sans problème de CORS en mode dev, en interrogeant simplement les chemins relatifs `/api/...`.

- **Gestion des Tokens JWT (`src/services/api.ts`)** :  
  Le client `api.ts` stocke le jeton d'accès en mémoire ou dans le stockage local, l'injecte dans l'en-tête `Authorization: Bearer <token>`, et intercepte les réponses `401 Unauthorized` pour tenter un rafraîchissement transparent via `/api/auth/token/refresh/`.

---

## 7. Production & Serveur Nginx

En production, l'application est compilée sous forme de fichiers statiques HTML/CSS/JS et servie par un conteneur **Nginx** optimisé :

- **Multi-Stage Build (`Dockerfile`)** :
  1. Étape `builder` : installation des dépendances et compilation via `npm run build`.
  2. Étape `runner` : image `nginx:alpine` minimale ne contenant que le dossier `dist/`.
- **En-têtes de Sécurité (`nginx.conf`)** :
  - `Content-Security-Policy` stricte isolant scripts, polices Google Fonts et connexions API.
  - `X-Frame-Options: DENY` (anti-clickjacking).
  - `X-Content-Type-Options: nosniff`.
  - Compression Gzip activée pour les scripts et feuilles de style.
  - Mise en cache immuable d'un an pour les assets versionnés sous `/assets/`.
  - Routage SPA (`try_files $uri $uri/ /index.html`).

---

## 8. Liens Utiles

- 🏠 **[README Racine du Projet](../README.md)** : vue d'ensemble du produit, démarrage complet et Docker Compose.
- ⚙️ **[README Backend](../backend/README.md)** : documentation de l'API Django REST Framework et du moteur de jeu.
- 🛡️ **[Politique de Sécurité](../SECURITY.md)** : conformité OWASP, gestion des vulnérabilités et règles de sécurité.
- 📋 **[Cahier des Charges](../docs/cahier-des-charges.md)** : spécifications fonctionnelles détaillées.
