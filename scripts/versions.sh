#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/lib/deploy-lib.sh"

NOW="$(running_api)"
step "venku právě teď — ${KSIROVKA_ENV}"
ok "$NOW"
git log -1 --format='      %s%n      %an, %ar' "$NOW" 2>/dev/null || dim "(commit nemám lokálně)"

step "historie nasazení"
ssh_ "test -f $HISTORY && tail -10 $HISTORY" 2>/dev/null | while read -r when tag note; do
  mark="  "; [ "$tag" = "$NOW" ] && mark=" →"
  printf '%s %s  %s %s\n' "$mark" "$tag" "${when%T*}" "${note:-}"
done || dim "(zatím prázdná)"

step "poslední commity na main"
git fetch -q origin main 2>/dev/null || true
git log -8 --format='%h%x09%s' origin/main 2>/dev/null | while IFS=$'\t' read -r sha subject; do
  if remote_has_tag "$API_IMAGE" "$sha" 2>/dev/null; then
    printf '  %s%s%s  %s\n' "$C_OK" "$sha" "$C_OFF" "${subject:0:60}"
  else
    printf '  %s%s  %s (image není)%s\n' "$C_DIM" "$sha" "${subject:0:60}" "$C_OFF"
  fi
done
