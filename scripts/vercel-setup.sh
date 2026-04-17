#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DEPLOY=false

for arg in "$@"; do
  case "$arg" in
    --deploy)
      DEPLOY=true
      ;;
    -h|--help)
      cat <<'EOF'
Usage: ./scripts/vercel-setup.sh [--deploy]

Options:
  --deploy    Push the required production env vars to Vercel, pull the
              production environment locally, build, and deploy to production.
EOF
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg" >&2
      exit 1
      ;;
  esac
done

require_command() {
  local name="$1"

  if ! command -v "$name" >/dev/null 2>&1; then
    echo "Missing required command: $name" >&2
    exit 1
  fi
}

require_var() {
  local name="$1"

  if [ -z "${!name:-}" ]; then
    echo "Missing required environment variable: $name" >&2
    exit 1
  fi
}

add_or_update_env() {
  local name="$1"
  local value="$2"

  if printf "%s" "$value" | npx vercel@latest env update "$name" production >/dev/null 2>&1; then
    echo "Updated $name in Vercel production environment."
    return
  fi

  printf "%s" "$value" | npx vercel@latest env add "$name" production >/dev/null
  echo "Added $name to Vercel production environment."
}

require_command npx

if ! npx --yes vercel@latest --version >/dev/null 2>&1; then
  echo "Unable to run the Vercel CLI via npx." >&2
  exit 1
fi

echo "Checking Vercel authentication..."
npx vercel@latest whoami >/dev/null

if [ ! -f ".vercel/project.json" ]; then
  echo "Linking this directory to a Vercel project..."
  npx vercel@latest link
fi

echo "Pulling production project settings..."
npx vercel@latest pull --yes --environment=production

if [ "$DEPLOY" = false ]; then
  cat <<'EOF'
Project linked and production settings pulled.

Export these variables in your shell before running with --deploy:
  DATABASE_URL
  NEXTAUTH_URL
  NEXTAUTH_SECRET
  OPENAI_API_KEY

Example:
  export DATABASE_URL="postgresql://..."
  export NEXTAUTH_URL="https://your-project.vercel.app"
  export NEXTAUTH_SECRET="replace-with-a-long-random-secret"
  export OPENAI_API_KEY="sk-..."
  ./scripts/vercel-setup.sh --deploy
EOF
  exit 0
fi

require_var DATABASE_URL
require_var NEXTAUTH_URL
require_var NEXTAUTH_SECRET
require_var OPENAI_API_KEY

echo "Uploading production environment variables to Vercel..."
add_or_update_env "DATABASE_URL" "$DATABASE_URL"
add_or_update_env "NEXTAUTH_URL" "$NEXTAUTH_URL"
add_or_update_env "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"
add_or_update_env "OPENAI_API_KEY" "$OPENAI_API_KEY"

echo "Refreshing local production env snapshot..."
npx vercel@latest pull --yes --environment=production

echo "Building production artifacts..."
npx vercel@latest build --prod

echo "Deploying to Vercel production..."
npx vercel@latest deploy --prebuilt --prod
