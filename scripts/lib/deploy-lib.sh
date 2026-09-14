# Společný základ pro deploy, rollback a versions.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

set -a
# shellcheck disable=SC1091
source deploy/target.env
set +a

KSIROVKA_ENV=production
if [ "${1:-}" = "--staging" ]; then KSIROVKA_ENV=staging; shift; fi
export KSIROVKA_ENV

KEY="${KSIROVKA_SSH_KEY}"
HOST="${KSIROVKA_HOST}"
REGISTRY="${KSIROVKA_REGISTRY}"
if [ "$KSIROVKA_ENV" = "staging" ]; then
  DEPLOY_DIR="${KSIROVKA_STAGING_DIR}"
  KSIROVKA_URL="${KSIROVKA_STAGING_URL}"
  COMPOSE_SRC="deploy/docker-compose.staging.yml"
  PROJECT="ksirovka-staging"
  APP_SVC="ksirovka-staging-api"
  PG_SVC="ksirovka-staging-postgres"
else
  DEPLOY_DIR="${KSIROVKA_DEPLOY_DIR}"
  COMPOSE_SRC="deploy/docker-compose.yml"
  PROJECT="ksirovka"
  APP_SVC="ksirovka-api"
  PG_SVC="ksirovka-postgres"
fi

API_CONTAINER="${PROJECT}-${APP_SVC}-1"
PG_CONTAINER="${PROJECT}-${PG_SVC}-1"
API_IMAGE="${REGISTRY}/ksirovka"
HISTORY="${DEPLOY_DIR}/deploy-history.log"
MIN_TABLES=12

ssh_() { ssh -n -i "$KEY" -o ConnectTimeout=15 "$HOST" "$@"; }

if [ -t 1 ]; then C_OK=$'\033[32m'; C_ERR=$'\033[31m'; C_DIM=$'\033[2m'; C_OFF=$'\033[0m'
else C_OK=""; C_ERR=""; C_DIM=""; C_OFF=""; fi

ok()   { printf '  %s✓%s %s\n' "$C_OK" "$C_OFF" "$*"; }
err()  { printf '  %s✗%s %s\n' "$C_ERR" "$C_OFF" "$*"; }
warn() { printf '  %s⚠%s %s\n' "$C_ERR" "$C_OFF" "$*"; }
dim()  { printf '  %s%s%s\n' "$C_DIM" "$*" "$C_OFF"; }
step() { printf '\n── %s ──\n' "$*"; }

short_sha() { git rev-parse --short=7 "${1:-HEAD}"; }

running_api() {
  local ip="${HOST#*@}"
  local extra=()
  if [[ "$KSIROVKA_URL" == https://* ]]; then
    extra=(--resolve "${KSIROVKA_DOMAIN}:443:${ip}")
  fi
  curl -fsS --max-time 20 "${extra[@]}" "$KSIROVKA_URL/health" 2>/dev/null \
    | python3 -c 'import json,sys; print(json.load(sys.stdin).get("commit","?"))' 2>/dev/null \
    || echo "?"
}

remote_has_tag() {
  local out
  out="$(ssh_ "docker manifest inspect $1:$2 2>&1")" || true
  if printf '%s' "$out" | grep -qiE 'denied|unauthorized|authentication|login required|no basic auth'; then
    return 2
  fi
  printf '%s' "$out" | grep -q schemaVersion
}

require_clean_tree() {
  if ! git diff --quiet || ! git diff --cached --quiet; then
    err "pracovní strom není čistý"
    dim "image se staví z commitu — co není zacommitované, na serveru nebude"
    exit 1
  fi
}

missing_env_vars() {
  local required have
  required="$(grep -oE '\$\{[A-Z_]+\}' "$COMPOSE_SRC" | tr -d '${}' | sort -u)"
  have="$(ssh_ "grep -oE '^[A-Z_]+=' $DEPLOY_DIR/.env 2>/dev/null | tr -d =" | sort -u)"
  comm -23 <(printf '%s\n' "$required") <(printf '%s\n' "$have")
}
