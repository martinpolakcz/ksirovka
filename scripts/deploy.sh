#!/usr/bin/env bash
# Nasadit konkrétní verzi. Nic se tu nestaví.
#
#   ./scripts/deploy.sh
#   ./scripts/deploy.sh a1b2c3d
#   ./scripts/deploy.sh --staging

source "$(dirname "${BASH_SOURCE[0]}")/lib/deploy-lib.sh"

TAG="${1:-}"
if [ -z "$TAG" ]; then
  require_clean_tree
  TAG="$(short_sha)"
  dim "bez argumentu → aktuální commit ($TAG)"
fi

PREVIOUS="$(running_api)"

if [ "$KSIROVKA_ENV" = "staging" ]; then
  step "STAGING → $TAG"
else
  printf '\n%s╺━ PRODUKCE ━╸%s %s\n' "$C_ERR" "$C_OFF" "$TAG"
fi
[ "$PREVIOUS" != "?" ] && dim "teď běží: $PREVIOUS"

if remote_has_tag "$API_IMAGE" "$TAG"; then
  :
else
  case $? in
    2)
      err "server není přihlášený do ghcr.io — image tam je, VPS ho nevidí"
      dim "ssh -i $KEY $HOST"
      dim "docker login ghcr.io -u martinpolakcz"
      dim "token s právem read:packages, pak znovu ./scripts/deploy.sh"
      ;;
    *)
      err "verze $TAG není v registru"
      dim "buď ještě neproběhlo CI, nebo je ten commit jen u tebe"
      ;;
  esac
  exit 1
fi
ok "verze $TAG je v registru"

step "stahuji image"
ssh_ "docker pull -q $API_IMAGE:$TAG" >/dev/null
ok "staženo"

ssh_ "mkdir -p $DEPLOY_DIR && touch $DEPLOY_DIR/.env && chmod 600 $DEPLOY_DIR/.env"
rsync -az -e "ssh -i $KEY" "$COMPOSE_SRC" "$HOST:$DEPLOY_DIR/docker-compose.yml"
if [ "$KSIROVKA_ENV" = "staging" ]; then
  rsync -az --inplace -e "ssh -i $KEY" deploy/Caddyfile.staging "$HOST:$DEPLOY_DIR/Caddyfile.staging"
else
  rsync -az --inplace -e "ssh -i $KEY" deploy/Caddyfile "$HOST:$DEPLOY_DIR/Caddyfile"
fi

ssh_ "cd $DEPLOY_DIR && sed -i '/^IMAGE_TAG=/d' .env && echo 'IMAGE_TAG=$TAG' >> .env"
if [ "$KSIROVKA_ENV" = "staging" ]; then
  ssh_ "cd $DEPLOY_DIR && sed -i '/^KSIROVKA_STAGING_DOMAIN=/d' .env && echo 'KSIROVKA_STAGING_DOMAIN=$KSIROVKA_STAGING_DOMAIN' >> .env"
else
  ssh_ "cd $DEPLOY_DIR && sed -i '/^KSIROVKA_DOMAIN=/d' .env && echo 'KSIROVKA_DOMAIN=$KSIROVKA_DOMAIN' >> .env"
fi

MISSING="$(missing_env_vars)"
if [ -n "$MISSING" ]; then
  err "v $DEPLOY_DIR/.env chybí povinné proměnné:"
  echo "$MISSING" | sed 's/^/      /'
  dim "heslo do Postgresu generuj jako hex, ne base64"
  exit 1
fi

step "migrace"
if ! ssh_ "cd $DEPLOY_DIR && docker compose run --rm $APP_SVC node dist/migrate.js" 2>&1 \
    | sed 's/^/  /'; then
  err "migrace selhaly — NEPŘEPÍNÁM"
  exit 1
fi

step "přepínám"
ssh_ "cd $DEPLOY_DIR && docker compose up -d" >/dev/null 2>&1

printf '  '
for _ in $(seq 1 30); do
  [ "$(running_api)" = "$TAG" ] && break
  printf '.'; sleep 2
done
echo

NOW="$(running_api)"
if [ "$NOW" = "$TAG" ]; then
  ok "API běží $TAG"
  ssh_ "echo \"\$(date -u +%Y-%m-%dT%H:%M:%SZ) $TAG\" >> $HISTORY"
  LEN="$(ssh_ "docker exec $API_CONTAINER sh -c 'printf %s \"\$ADMIN_SESSION_SECRET\" | wc -c'")"
  [ "$LEN" -gt 8 ] && ok "ADMIN_SESSION_SECRET uvnitř kontejneru má $LEN znaků" \
    || warn "ADMIN_SESSION_SECRET uvnitř kontejneru vypadá prázdný"
  step "hotovo"
  dim "návrat: ./scripts/rollback.sh"
  exit 0
fi

err "API hlásí \"$NOW\", čekal jsem \"$TAG\""
[ "$PREVIOUS" != "?" ] && dim "vrať se: ./scripts/rollback.sh $PREVIOUS"
exit 1
