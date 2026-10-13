#!/usr/bin/env bash
# Local smoke check for test-generation.yml (no Cursor agent run).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "== Workflow present =="
test -f .github/workflows/test-generation.yml

echo "== Agent step bash syntax =="
script="$(mktemp)"
sed -n '65,90p' .github/workflows/test-generation.yml | sed 's/^          //' >"$script"
bash -n "$script"
rm -f "$script"

echo "== npm ci =="
npm ci

echo "== Playwright chromium =="
npx playwright install --with-deps chromium

echo "== GitHub secrets (names only) =="
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  REQUIRED=(
    APP_URL APP_USER_EMAIL APP_USER_PASSWORD APP_ALT_USER_EMAIL APP_ALT_USER_PASSWORD
    ATLASSIAN_BASE_URL ATLASSIAN_EMAIL JIRA_PROJECT_KEY CONFLUENCE_SPACE_KEY
    CURSOR_API_KEY ATLASSIAN_API_TOKEN CURSOR_GH_MCP
  )
  NAMES="$(gh secret list --json name -q '.[].name' || true)"
  missing=0
  for s in "${REQUIRED[@]}"; do
    if echo "$NAMES" | grep -Fx "$s" >/dev/null; then
      echo "OK  $s"
    else
      echo "MISS $s"
      missing=$((missing + 1))
    fi
  done
  if ((missing > 0)); then
    echo "== $missing secret(s) missing on GitHub =="
    exit 1
  fi
else
  echo "gh not authenticated; skip secret audit"
fi

echo "== Smoke OK =="
