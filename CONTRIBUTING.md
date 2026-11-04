# Contribuer à Youth City

Ce document applique les exigences QUA-01 à QUA-03 et SEC-01 du cahier des charges (§49).

## Flux de travail

1. Ne jamais committer directement sur `main`. Créer une branche : `feat/…`, `fix/…`, `chore/…`, `docs/…`.
2. Committer par petites unités, avec des messages **conventionnels** :
   `type(portée): résumé à l'impératif`, par exemple `fix(finance): refuser un virement négatif`.
   Types : `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`. Un `!` après le type signale une
   rupture de compatibilité (`feat(api)!: …`).
3. Ouvrir une demande de fusion (pull request). La CI doit être verte avant la fusion.
4. Une règle sensible (argent, XP, accès) se valide côté serveur et laisse un test (§49.11).

## Contrôles locaux (identiques à la CI)

Backend, depuis `backend/` avec l'environnement virtuel activé :

```bash
pip install -r requirements-dev.txt
ruff check .
python manage.py makemigrations --check --dry-run
python manage.py check
coverage run manage.py test && coverage report
pip-audit -r requirements.txt
```

Frontend, depuis `frontend/` :

```bash
npm ci
npm run lint
npm run build        # inclut la vérification des types
npm audit --audit-level=high
```

## Hooks locaux (pré-commit)

Une fois par poste :

```bash
sh scripts/install-hooks.sh          # Linux / macOS / Git Bash
powershell -File scripts/install-hooks.ps1   # Windows
```

À chaque commit : hygiène des fichiers, `ruff` sur le backend, `oxlint` sur le frontend.
À chaque push : vérification des types du frontend. Les hooks accélèrent le retour, la CI reste la référence.

## Réglages à faire une fois sur GitHub (administrateur du dépôt)

Ces réglages ne peuvent pas être versionnés dans le dépôt :

- **Settings → Branches → règle pour `main`** :
  - exiger une pull request avant fusion (si vous travaillez seul, 0 approbation, mais gardez la pull request) ;
  - exiger la réussite du contrôle **`ci-success`** et une branche à jour ;
  - interdire les push forcés et la suppression de la branche.
- **Settings → Code security** : activer *Dependabot alerts* et *Dependabot security updates*.
- **Settings → Actions → General** : permissions par défaut du jeton en *lecture seule*.

## Dépendances et sécurité

Dependabot ouvre chaque lundi des demandes de mise à jour groupées (`.github/dependabot.yml`).
Délais de correction (SEC-01) : faille **haute ou critique sous 7 jours**, autre faille sous 30 jours.
La CI échoue si `pip-audit` ou `npm audit` (niveau élevé) trouvent une vulnérabilité connue.
