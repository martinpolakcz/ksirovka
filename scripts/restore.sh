#!/usr/bin/env bash
# Obnovit databázi. PŘEPÍŠE obsah. Není tlačítko v Dev Manageru.
#
#   ./scripts/restore.sh ksirovka-20260914-030000.sql.gz --i-understand

source "$(dirname "${BASH_SOURCE[0]}")/lib/deploy-lib.sh"

DUMP="${1:-}"
if [ -z "$DUMP" ] || [ "${2:-}" != "--i-understand" ]; then
  err "chybí soubor nebo potvrzení"
  dim "./scripts/restore.sh <soubor.sql.gz> --i-understand"
  exit 1
fi

BASE="$(basename "$DUMP")"
SAFETY="/opt/ksirovka-backups/ksirovka-pred-obnovou-$(date -u +%Y%m%d-%H%M%S).sql.gz"
step "obnova — současný stav odkládám"
ssh_ "PGPW=\$(docker exec $PG_CONTAINER printenv POSTGRES_PASSWORD)
  docker exec -e PGPASSWORD=\"\$PGPW\" $PG_CONTAINER pg_dump -U ksirovka --clean --if-exists --no-owner ksirovka | gzip -9 > $SAFETY
  gzip -t $SAFETY"
ok "$SAFETY"

if [ -f "$DUMP" ]; then
  gzip -t "$DUMP"
  rsync -az -e "ssh -i $KEY" "$DUMP" "$HOST:/opt/ksirovka-backups/$BASE"
fi

ssh_ "cd $DEPLOY_DIR && docker compose stop $APP_SVC" >/dev/null 2>&1
ssh_ "PGPW=\$(docker exec $PG_CONTAINER printenv POSTGRES_PASSWORD)
  gunzip -c /opt/ksirovka-backups/$BASE | docker exec -i -e PGPASSWORD=\"\$PGPW\" $PG_CONTAINER psql -U ksirovka -d ksirovka -v ON_ERROR_STOP=1 -q"
ok "obnoveno"
ssh_ "cd $DEPLOY_DIR && docker compose start $APP_SVC" >/dev/null 2>&1
dim "zpět: ./scripts/restore.sh $SAFETY --i-understand"
