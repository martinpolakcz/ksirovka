#!/usr/bin/env bash
# Expo Go znovu na LAN a nasazení aktuálního commitu na VPS.
# Image staví CI. Tady se jen pushne main, počká se na běh a server image stáhne.
#
#   ./scripts/reload-and-deploy.sh
#   ./scripts/reload-and-deploy.sh --eas    # navíc iOS + Android AAB + preview APK
#
# Necommitne. Špinavý strom webu skončí chybou. Číslo verze v obchodě zvedá jen --eas.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ROOT="/Users/martin.polak/Projects/ksirovka-app2/ksirovka-app"
REPO="martinpolakcz/ksirovka"
LOG="${TMPDIR:-/tmp}/ksirovka-expo-go.log"
cd "$ROOT"

step() { printf '\n── %s ──\n' "$*"; }
ok()   { printf '  ✓ %s\n' "$*"; }
err()  { printf '  ✗ %s\n' "$*" >&2; }

WITH_EAS=0
if [ "${1:-}" = "--eas" ]; then
  WITH_EAS=1
elif [ -n "${1:-}" ]; then
  err "neznámý argument: $1"
  exit 2
fi

if [ -n "$(git status --porcelain)" ]; then
  err "web má necommitnuté změny — nejdřív commit, pak znovu tohle tlačítko"
  git status --short
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "main" ]; then
  err "nasazuje se jen z main, teď jsi na $BRANCH"
  exit 1
fi

TAG="$(git rev-parse --short=7 HEAD)"

step "Expo Go"
if [ ! -d "$APP_ROOT/node_modules/expo" ]; then
  err "chybí $APP_ROOT — nejdřív tam npm install"
  exit 1
fi

PIDS="$(lsof -nP -iTCP:8081 -sTCP:LISTEN -t 2>/dev/null || true)"
if [ -n "$PIDS" ]; then
  # shellcheck disable=SC2086
  kill $PIDS 2>/dev/null || true
  sleep 1
fi

setsid npm run start:lan -- --clear >"$LOG" 2>&1 < /dev/null &
METRO_PID=$!
ok "Metro startuje (pid $METRO_PID), log $LOG"

ready=0
for _ in $(seq 1 30); do
  if lsof -nP -iTCP:8081 -sTCP:LISTEN >/dev/null 2>&1; then
    ready=1
    break
  fi
  if ! kill -0 "$METRO_PID" 2>/dev/null; then
    err "Metro spadlo, konec logu:"
    tail -n 30 "$LOG" >&2 || true
    exit 1
  fi
  sleep 1
done
[ "$ready" = 1 ] || { err "Metro neposlouchá na 8081"; tail -n 30 "$LOG" >&2 || true; exit 1; }

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -n "$LAN_IP" ]; then
  ok "v Expo Go otevři exp://${LAN_IP}:8081"
else
  ok "Metro běží na portu 8081"
fi

step "push $TAG"
git push origin HEAD
ok "origin/main má $TAG"

step "čekám na CI"
RUN_URL=""
for _ in $(seq 1 40); do
  LINE="$(gh run list --repo "$REPO" --commit "$(git rev-parse HEAD)" --limit 1 \
    --json status,conclusion,databaseId,url \
    --jq '.[0] | "\(.status) \(.conclusion // "-") \(.databaseId // "-") \(.url // "-")"' 2>/dev/null || true)"
  echo "  $LINE"
  case "$LINE" in
    completed\ success*)
      RUN_URL="${LINE##* }"
      break
      ;;
    completed\ *)
      err "CI neskončilo úspěchem: $LINE"
      exit 1
      ;;
  esac
  sleep 15
done
if [ -z "$RUN_URL" ]; then
  err "CI se nedočkalo"
  exit 1
fi
ok "CI hotové: $RUN_URL"

step "záloha a deploy $TAG"
"$ROOT/scripts/backup.sh"
"$ROOT/scripts/deploy.sh" "$TAG"

step "ověření"
BODY="$(curl -4 -fsS --max-time 20 https://ksirovka.martinpolak.cz/health)"
echo "  $BODY"
printf '%s' "$BODY" | grep -q "\"commit\":\"$TAG\"" || {
  err "/health nehlásí $TAG"
  exit 1
}
ok "produkce běží $TAG"

if [ "$WITH_EAS" = 1 ]; then
  step "EAS"
  (
    cd "$APP_ROOT"
    npx eas-cli build --platform ios --profile production --non-interactive --no-wait --auto-submit
    npx eas-cli build --platform android --profile production --non-interactive --no-wait
    npx eas-cli build --platform android --profile preview --non-interactive --no-wait
  )
  ok "EAS buildy jsou ve frontě (číslo verze se zvedlo)"
fi

printf '\nHotovo. Expo Go: reload projektu. Rollback: ./scripts/rollback.sh\n'
