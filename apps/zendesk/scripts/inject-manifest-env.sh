#!/usr/bin/env bash
#
# inject-manifest-env.sh — Replace {{VAR}} placeholders in dist/manifest.json
# with values from the environment (or the specified .env file).
#
# Usage:
#   ./scripts/inject-manifest-env.sh [env-file]
#
# Examples:
#   ./scripts/inject-manifest-env.sh .env.development
#   ./scripts/inject-manifest-env.sh .env.production
#   ZENDESK_APP_OAUTH_CLIENT_SECRET=xyz ./scripts/inject-manifest-env.sh
#
set -euo pipefail

MANIFEST="dist/package/manifest.json"
ENV_FILE="${1:-}"

if [ ! -f "$MANIFEST" ]; then
  echo "Error: $MANIFEST not found. Run the build first." >&2
  exit 1
fi

# Source the env file if provided (strips quotes, skips comments)
if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
  set -a
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ "$key" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$key" ]] && continue
    # Strip surrounding quotes from value
    value="${value#\'}"
    value="${value%\'}"
    value="${value#\"}"
    value="${value%\"}"
    export "$key=$value"
  done < "$ENV_FILE"
  set +a
fi

# List of variables to substitute in the manifest
VARS=(
  VITE_API_BASE_URL
  ZENDESK_DOMAIN_WHITELIST
)

for var in "${VARS[@]}"; do
  val="${!var:-}"
  # Use | as sed delimiter to avoid conflicts with URLs containing /
  sed -i'' -e "s|{{${var}}}|${val}|g" "$MANIFEST"
done

# Check for unresolved placeholders (variables not in VARS list)
UNRESOLVED=$(grep -oE '\{\{[A-Z_]+\}\}' "$MANIFEST" 2>/dev/null || true)
if [ -n "$UNRESOLVED" ]; then
  echo "Warning: Unresolved placeholders in $MANIFEST:" >&2
  echo "$UNRESOLVED" >&2
  exit 1
fi

# Warn about empty values (non-fatal)
for var in "${VARS[@]}"; do
  val="${!var:-}"
  if [ -z "$val" ]; then
    echo "Note: $var is empty — set it in your env file or environment." >&2
  fi
done

echo "Manifest environment variables injected successfully."
