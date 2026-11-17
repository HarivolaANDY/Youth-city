# Installe les hooks locaux (pré-commit et pré-push).
$ErrorActionPreference = 'Stop'
python -m pip install --upgrade pre-commit
pre-commit install --install-hooks
Write-Host "Hooks installés : ruff, oxlint, tsc et hygiène des fichiers au commit."
