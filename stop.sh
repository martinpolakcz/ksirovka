#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
pkill -f "vite" 2>/dev/null || true
pkill -f "tsx watch src/index.ts" 2>/dev/null || true
docker compose stop
