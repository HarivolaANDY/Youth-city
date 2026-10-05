# 🛡️ Politique de Sécurité & Architecture de Défense en Profondeur — Youth City

Ce document consigne la politique de sécurité, les procédures de signalement des vulnérabilités et l'architecture défensive mise en œuvre sur la plateforme **Youth City**, conformément aux référentiels **OWASP Top 10**, **OWASP Top 10 for LLM Applications (2025)** et **OWASP Agentic AI Security**.

---

## 1. Procédure de Signalement des Vulnérabilités

La sécurité des données et le bien-être de nos utilisateurs citoyens sont une priorité absolue. Si vous découvrez une faille ou une anomalie de sécurité dans Youth City :
1. **Divulgation Responsable** : Ne publiez pas la faille publiquement (issue GitHub, réseaux sociaux, forum).
2. **Contact d'Urgence** : Signalez le problème à l'équipe technique à l'adresse `security@youthcity.mg` (ou via l'espace de modération sécurisé).
3. **Contenu du Rapport** :
   - Description claire du scénario de vulnérabilité.
   - Étapes de reproduction (PoC minimal).
   - Impact potentiel estimé sur les citoyens ou l'infrastructure.
4. **Délai de Réponse** : Notre équipe s'engage à accuser réception sous 48 heures ouvrées et à appliquer un correctif dans les plus brefs délais.

---

## 2. Feuille de Route de Sécurisation (Tableau 4 — Audit OWASP Agentic AI)

Les cinq paliers de priorités (**P1 à P5**) du plan de remédiation ont été intégralement déployés et vérifiés.

### 🔒 P1 : Durcissement des Secrets & Environnement de Production
- **Fail-Closed Configuration** : En mode `DEBUG = False`, le serveur refuse impérativement de démarrer (`ImproperlyConfigured`) si la clé secrète Django par défaut ou non sécurisée est utilisée.
- **Gestionnaire d'Environnement Sans Dépendance** : Chargeur natif `.env` sans dépendance tierce vulnérable.
- **Contrôle Strict des Hôtes & CORS** : Filtrage dynamique des origines autorisées via `DJANGO_ALLOWED_HOSTS` et `CORS_ALLOWED_ORIGINS`.
- **En-têtes HTTP de Sécurité** :
  - `X-Frame-Options: DENY` (protection anti-clickjacking).
  - `X-Content-Type-Options: nosniff` (protection contre le reniflage MIME).
  - `SECURE_BROWSER_XSS_FILTER: True`.
  - `SESSION_COOKIE_HTTPONLY: True` & `CSRF_COOKIE_HTTPONLY: True`.

### 🧠 P2 : Isolation du Prompt NOVA & Garde-Fous Anti-Injection
- **Architecture de Délimiteurs Système** : Le prompt du mentor IA NOVA isole strictement les instructions système, les règles éthiques et le contexte de jeu via des balises explicites étanches :
  - `### SYSTEM_INSTRUCTIONS ###`
  - `### ETHICAL_AND_SECURITY_GUARDRAILS ###`
  - `### CITIZEN_STATE_CONTEXT ###`
- **Plafond d'Entrée Client & Serveur** : Limite stricte de 500 caractères sur les messages envoyés à NOVA pour prévenir le déni de portefeuille et la saturation de contexte.
- **Filtrage des Caractères de Contrôle** : Suppression des caractères invisibles et octets de contrôle ASCII/Unicode.
- **Rejet Instantané des Signatures d'Évasion** : Blocage et message didactique en cas de détection de motifs tels que `ignore previous instructions`, `system prompt`, `mode sans restriction`, `jailbreak`, etc.

### ⏱️ P3 : Quotas & Throttling Dédié sur le Mentorat IA
- **Protection Anti-DDoS & Anti-Exhaustion** : Création d'un throttle REST Framework dédié `NovaChatRateThrottle(AnonRateThrottle)` configuré à `20 requêtes/minute` pour le canal de discussion IA.
- **Throttling d'Authentification** :
  - `LoginRateThrottle` : Limité à 5 tentatives par minute avec journalisation des échecs et IP associées.
  - `RegisterRateThrottle` : Limité à 3 créations de compte par minute pour parer aux bots de spam.
- **Endpoint Backend Résilient** : Création de la route `/api/nova/chat/` avec réponse adaptative fondée sur l'état réel du citoyen (trésorerie, emploi, formation).

### 🧹 P4 : Sanitization du Contenu Utilisateur Tiers contre l'Injection Indirecte
- **Module Centralisé `game.sanitizers`** :
  - `strip_control_and_invisible_chars` : Élimination des octets nuls (`\x00`), des caractères de contrôle et des overrides bidirectionnels Unicode (`\u202E`, etc.) prévenant les attaques de dissimulation visuelle (bidi spoofing).
  - `strip_tags` : Neutralisation stricte des balises HTML et scripts malveillants (`<script>`, `<b>`, etc.).
  - `detect_indirect_prompt_injection` : Détection des directives de piratage dissimulées dans les textes soumis par des tiers (pitchs de startup, descriptifs de hackathons, motifs de signalement).
- **Points d'Application** :
  - Pitchs et projets d'incubateur (`/api/startup/create/`).
  - Candidatures et équipes de hackathons (`/api/hub/hackathons/<key>/participate/`).
  - Dépôt de signalements citoyens pour la modération (`/api/moderation/reports/create/`).
  - Personnalisation et noms des citoyens (`/api/character/customize/`).

### 📦 P5 : Conteneurisation & Isolation d'Exécution (Sandboxing)
- **Utilisateur Système Non-Privilégié** : Le conteneur backend s'exécute sous le compte `appuser` (UID `10001`, GID `10001`), sans aucun accès root sur le système hôte.
- **Isolation des Privilèges Docker** : Activation systématique de `no-new-privileges:true` pour bloquer toute escalade de privilèges via des binaires setuid.
- **Limitation des Ressources Matérielles** : Quotas stricts de CPU et mémoire alloués dans `docker-compose.yml` (Backend: 1.5 CPU max, 512 Mo RAM / Frontend: 1.0 CPU max, 256 Mo RAM).
- **Multi-Stage Build Frontend** : Compilation isolée des assets sous Node 22 Alpine puis déploiement ultra-léger et sécurisé sur Nginx Alpine avec en-têtes de sécurité renforcés (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
- **Réseau Bridge Interne Dédié** : Les services communiquent sur le sous-réseau privé `youthcity-network` sans exposition inutile des composants internes.

---

## 3. Liste de Contrôle pour le Déploiement en Production

Avant toute mise en ligne officielle :
- [ ] Créer un fichier `backend/.env` à partir de `.env.example`.
- [ ] Générer une clé secrète cryptographique forte (`python -c "import secrets; print(secrets.token_urlsafe(50))"`).
- [ ] Positionner `DJANGO_DEBUG=False`.
- [ ] Définir explicitement les noms de domaine dans `DJANGO_ALLOWED_HOSTS` et `CORS_ALLOWED_ORIGINS`.
- [ ] Lancer l'environnement conteneurisé : `docker compose up -d --build`.
- [ ] Vérifier que les healthchecks Docker sont à l'état `healthy`.
