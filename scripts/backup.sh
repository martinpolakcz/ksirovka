#!/usr/bin/env bash
# Dump databáze — na server a kopie k sobě. Ověření počtem CREATE TABLE.

source "$(dirname "${BASH_SOURCE[0]}")/lib/deploy-lib.sh"

REMOTE_DIR=/opt/ksirovka-backups
LOCAL_DIR="${KSIROVKA_BACKUP_DIR:-$HOME/ksirovka-backups}"
KEEP_DAYS=14
STAMP="$(date -u +%Y%m%d-%H%M%S)"

step "zálohuji ($STAMP)"
ssh_ "set -e -o pipefail
  mkdir -p $REMOTE_DIR
  PGPW=\$(docker exec $PG_CONTAINER printenv POSTGRES_PASSWORD)
  docker exec -e PGPASSWORD=\"\$PGPW\" $PG_CONTAINER \
    pg_dump -U ksirovka --clean --if-exists --no-owner ksirovka \
    | gzip -9 > $REMOTE_DIR/ksirovka-$STAMP.sql.gz
  gzip -t $REMOTE_DIR/ksirovka-$STAMP.sql.gz
  n=\$(gunzip -c $REMOTE_DIR/ksirovka-$STAMP.sql.gz | grep -c '^CREATE TABLE' || true)
  [ \"\$n\" -ge $MIN_TABLES ] || { echo \"V dumpu je jen \$n tabulek, čekal jsem $MIN_TABLES\"; exit 1; }
  echo \"  ksirovka-$STAMP.sql.gz: \$n tabulek\"
  find $REMOTE_DIR -name '*.sql.gz' -mtime +$KEEP_DAYS -delete"
ok "dump ověřen obsahem"

if [ "${1:-}" != "--server" ]; then
  mkdir -p "$LOCAL_DIR"
  rsync -az -e "ssh -i $KEY" "$HOST:$REMOTE_DIR/ksirovka-$STAMP.sql.gz" "$LOCAL_DIR/"
  gzip -t "$LOCAL_DIR/ksirovka-$STAMP.sql.gz"
  ok "kopie v $LOCAL_DIR"
fi
