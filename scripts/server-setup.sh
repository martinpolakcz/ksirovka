#!/usr/bin/env bash
# Z čistého stroje připravený stack. Idempotentní.

source "$(dirname "${BASH_SOURCE[0]}")/lib/deploy-lib.sh"

step "cíl"
dim "$HOST"
ssh_ "hostname; . /etc/os-release && echo \$PRETTY_NAME" | sed 's/^/  /'

step "docker"
if ssh_ "command -v docker" >/dev/null 2>&1; then
  ok "už je"
else
  ssh_ 'set -euo pipefail
. /etc/os-release
if [ "${ID:-}" = "ol" ] || [[ "${ID_LIKE:-}" == *rhel* ]]; then
  dnf -y install dnf-plugins-core
  dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
  dnf -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker
'
  ok "nainstalován"
fi

step "adresáře"
ssh_ "mkdir -p $DEPLOY_DIR /opt/ksirovka-backups && touch $DEPLOY_DIR/.env && chmod 600 $DEPLOY_DIR/.env"
ok "$DEPLOY_DIR"

rsync -az -e "ssh -i $KEY" "$COMPOSE_SRC" deploy/Caddyfile "$HOST:$DEPLOY_DIR/"
ssh_ "mv $DEPLOY_DIR/$(basename "$COMPOSE_SRC") $DEPLOY_DIR/docker-compose.yml" 2>/dev/null || true

step "hex hesla, pokud chybí"
ssh_ "python3 - <<'PY'
from pathlib import Path
import secrets
p = Path('$DEPLOY_DIR/.env')
text = p.read_text() if p.exists() else ''
changed = False
def ensure(key, value=None):
    global text, changed
    if any(line.startswith(key + '=') for line in text.splitlines()):
        return
    text += f'{key}={value or secrets.token_hex(24)}\\n'
    changed = True
ensure('PG_PASSWORD')
ensure('ADMIN_PASSWORD')
ensure('ADMIN_SESSION_SECRET')
ensure('KSIROVKA_DOMAIN', '$KSIROVKA_DOMAIN')
ensure('CADDY_EMAIL', 'martin.polak.cz@gmail.com')
ensure('CORS_ORIGIN', 'https://ksirovka.martinpolak.cz,https://ksirovka.cz')
if changed:
    p.write_text(text)
    p.chmod(0o600)
    print('doplněno')
else:
    print('už je')
PY"

step "ghcr.io"
if ssh_ "docker manifest inspect $API_IMAGE:main >/dev/null 2>&1"; then
  ok "server dosáhne na image"
elif ! ssh_ "test -f /root/.docker/config.json"; then
  err "server není přihlášený do ghcr.io"
  dim "docker login ghcr.io -u martinpolakcz"
else
  warn "přihlášený je, ale image:main ještě není — počkej na CI"
fi

step "noční záloha"
ssh_ "cat > /usr/local/bin/ksirovka-backup.sh <<'SH'
#!/bin/bash
set -euo pipefail
PG=\$(docker ps --format '{{.Names}}' | grep -E 'ksirovka-postgres-1$' | head -1)
PGPW=\$(docker exec \$PG printenv POSTGRES_PASSWORD)
STAMP=\$(date -u +%Y%m%d-%H%M%S)
docker exec -e PGPASSWORD=\"\$PGPW\" \$PG pg_dump -U ksirovka --clean --if-exists --no-owner ksirovka | gzip -9 > /opt/ksirovka-backups/ksirovka-\$STAMP.sql.gz
n=\$(gunzip -c /opt/ksirovka-backups/ksirovka-\$STAMP.sql.gz | grep -c '^CREATE TABLE' || true)
[ \"\$n\" -ge 12 ]
SH
chmod +x /usr/local/bin/ksirovka-backup.sh
cat > /etc/systemd/system/ksirovka-backup.service <<'UNIT'
[Unit]
Description=Dump databáze Kšírovka
[Service]
Type=oneshot
ExecStart=/usr/local/bin/ksirovka-backup.sh
UNIT
cat > /etc/systemd/system/ksirovka-backup.timer <<'UNIT'
[Unit]
Description=Denní záloha Kšírovka
[Timer]
OnCalendar=*-*-* 03:17:00
Persistent=true
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now ksirovka-backup.timer"
ok "timer 03:17 UTC"
