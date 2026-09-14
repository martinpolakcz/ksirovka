#!/usr/bin/env bash
# Zpátky na verzi, která fungovala. Databázi to nevrací.
#
#   ./scripts/rollback.sh
#   ./scripts/rollback.sh a1b2c3d
#   ./scripts/rollback.sh --staging

source "$(dirname "${BASH_SOURCE[0]}")/lib/deploy-lib.sh"

NOW="$(running_api)"
TAG="${1:-}"

if [ -z "$TAG" ]; then
  TAG="$(ssh_ "test -f $HISTORY && awk '{print \$2}' $HISTORY | grep -v '^$' | tail -20 | awk '!seen[\$0]++' | tail -2 | head -1" || true)"
  if [ -z "$TAG" ] || [ "$TAG" = "$NOW" ]; then
    err "nemám kam se vrátit"
    dim "./scripts/versions.sh"
    exit 1
  fi
  dim "o krok zpět: $NOW → $TAG"
fi

if ! remote_has_tag "$API_IMAGE" "$TAG"; then
  err "verze $TAG není v registru — nesahám na běžící systém"
  exit 1
fi

ssh_ "docker pull -q $API_IMAGE:$TAG" >/dev/null
ssh_ "cd $DEPLOY_DIR && sed -i '/^IMAGE_TAG=/d' .env && echo 'IMAGE_TAG=$TAG' >> .env && docker compose up -d $APP_SVC" >/dev/null 2>&1

printf '  '
for _ in $(seq 1 30); do
  [ "$(running_api)" = "$TAG" ] && break
  printf '.'; sleep 2
done
echo

if [ "$(running_api)" = "$TAG" ]; then
  ok "API běží $TAG"
  ssh_ "echo \"\$(date -u +%Y-%m-%dT%H:%M:%SZ) $TAG rollback\" >> $HISTORY"
  dim "databáze se nevracela"
  exit 0
fi
err "API se nevrátilo"
exit 1
