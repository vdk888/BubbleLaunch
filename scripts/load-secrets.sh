#!/usr/bin/env bash
# Decrypt SOPS-encrypted secrets.sops.env → .env.runtime for app startup.
#
# Usage:
#   ./scripts/load-secrets.sh            # decrypts to .env.runtime at project root
#   ./scripts/load-secrets.sh /tmp/foo   # decrypts to custom path
#
# Then:
#   - node loads via dotenv: prefers .env.runtime if present, else .env
#   - Production startup wrapper (Dockerfile / process manager) calls this before `node server.js`
#
# Requires:
#   - sops installed
#   - SOPS_AGE_KEY_FILE env var pointing at age private key
#     (default: ~/.config/sops/age/keys.txt)
#
# Idempotent — overwrites the destination file on each run.
# The destination file is .gitignored.

set -euo pipefail

# Resolve project root (directory containing .sops.yaml)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SOPS_FILE="$PROJECT_ROOT/secrets.sops.env"
DEST_FILE="${1:-$PROJECT_ROOT/.env.runtime}"

if [ ! -f "$SOPS_FILE" ]; then
  echo "ERROR: $SOPS_FILE not found" >&2
  exit 1
fi

# Ensure SOPS_AGE_KEY_FILE is set (default to ~/.config/sops/age/keys.txt)
if [ -z "${SOPS_AGE_KEY_FILE:-}" ]; then
  if [ -f "$HOME/.config/sops/age/keys.txt" ]; then
    export SOPS_AGE_KEY_FILE="$HOME/.config/sops/age/keys.txt"
  else
    echo "ERROR: SOPS_AGE_KEY_FILE not set and ~/.config/sops/age/keys.txt not found" >&2
    exit 1
  fi
fi

# Decrypt (atomic write via temp + rename)
TMP="$(mktemp -t bubble-secrets.XXXXXX)"
trap 'rm -f "$TMP"' EXIT

sops --decrypt "$SOPS_FILE" > "$TMP"
chmod 600 "$TMP"
mv "$TMP" "$DEST_FILE"
chmod 600 "$DEST_FILE"

# Count loaded keys (without printing values)
LOADED_KEYS=$(grep -c '^[A-Z_][A-Z0-9_]*=' "$DEST_FILE" || true)
echo "✓ Decrypted $SOPS_FILE → $DEST_FILE ($LOADED_KEYS keys loaded)"
