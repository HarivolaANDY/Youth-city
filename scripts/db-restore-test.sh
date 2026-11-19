#!/usr/bin/env bash
# Restauration à blanc de la base PostgreSQL (OPS-03).
#
# 1. sauvegarde fraîche de la base de production (pg_dump) ;
# 2. restauration dans une base jetable ;
# 3. comparaison du nombre de lignes de chaque table (source vs restauration) ;
# 4. suppression de la base jetable et compte rendu daté dans docs/restauration/.
#
# Prérequis : la pile tourne (`docker compose up -d`). Ne modifie jamais la base de production.
# Usage : bash scripts/db-restore-test.sh
set -euo pipefail

cd "$(dirname "$0")/.."

STAMP="$(date +%Y-%m-%d_%H%M%S)"
SCRATCH="restore_test_$(date +%s)"
DUMP="/tmp/restore-test-${STAMP}.dump"
REPORT_DIR="docs/restauration"
REPORT="${REPORT_DIR}/restauration-${STAMP}.md"
BK=(docker compose exec -T db-backup)

mkdir -p "$REPORT_DIR"

cleanup() {
  "${BK[@]}" dropdb --if-exists "$SCRATCH" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Nombre de lignes de chaque table du schéma public, « table=n », triées.
count_rows() {
  "${BK[@]}" psql -d "$1" -At -c "
    SELECT format('%s=%s', c.relname,
      (xpath('/row/c/text()', query_to_xml(format('SELECT count(*) AS c FROM %I', c.relname), false, true, '')))[1]::text)
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY 1"
}

echo "1/4 Sauvegarde fraîche de la base source…"
START=$(date +%s)
"${BK[@]}" pg_dump -Fc -f "$DUMP"
SIZE="$("${BK[@]}" sh -c "wc -c < '$DUMP'" | tr -d '[:space:]')"

echo "2/4 Restauration dans la base jetable « $SCRATCH »…"
"${BK[@]}" createdb "$SCRATCH"
"${BK[@]}" pg_restore --no-owner --exit-on-error -d "$SCRATCH" "$DUMP"
DURATION=$(( $(date +%s) - START ))

echo "3/4 Comparaison des tables…"
SOURCE_DB="$("${BK[@]}" sh -c 'printf %s "$PGDATABASE"')"
SOURCE_COUNTS="$(count_rows "$SOURCE_DB")"
RESTORED_COUNTS="$(count_rows "$SCRATCH")"
TABLES="$(printf '%s\n' "$SOURCE_COUNTS" | grep -c '=' || true)"

STATUS="RÉUSSIE"
DIFF=""
if [ "$TABLES" -eq 0 ]; then
  STATUS="ÉCHEC (aucune table trouvée dans la source)"
elif [ "$SOURCE_COUNTS" != "$RESTORED_COUNTS" ]; then
  STATUS="ÉCHEC (écarts entre la source et la restauration)"
  DIFF="$(diff <(printf '%s\n' "$SOURCE_COUNTS") <(printf '%s\n' "$RESTORED_COUNTS") || true)"
fi

echo "4/4 Compte rendu : $REPORT"
{
  echo "# Restauration à blanc — ${STAMP}"
  echo
  echo "- **Résultat** : ${STATUS}"
  echo "- **Tables comparées** : ${TABLES}"
  echo "- **Taille de la sauvegarde** : ${SIZE} octets"
  echo "- **Durée (sauvegarde + restauration)** : ${DURATION} s"
  echo "- **Objectifs OPS-03** : perte maximale 24 h (sauvegarde quotidienne), rétablissement en 4 h"
  echo
  echo "## Lignes par table (source)"
  echo
  echo '```'
  printf '%s\n' "$SOURCE_COUNTS"
  echo '```'
  if [ -n "$DIFF" ]; then
    echo
    echo "## Écarts"
    echo
    echo '```diff'
    printf '%s\n' "$DIFF"
    echo '```'
  fi
} > "$REPORT"

echo "Restauration à blanc : ${STATUS}"
[ "$STATUS" = "RÉUSSIE" ]
