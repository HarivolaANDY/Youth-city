#!/usr/bin/env sh
# Installe les hooks locaux (pré-commit et pré-push).
set -e
python -m pip install --upgrade pre-commit
pre-commit install --install-hooks
echo "Hooks installés : ruff, oxlint et hygiène des fichiers au commit ; tsc au push."
