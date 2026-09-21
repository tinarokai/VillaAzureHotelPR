#!/bin/sh
# Deploys a password-gated copy of public/ to the "review" branch of the villa-azure-hotel
# Pages project (https://review.villa-azure-hotel.pages.dev). Production (branch main) is untouched.
# Gate = functions/_middleware.ts (basic auth, /api/* disabled, noindex). Run from anywhere.
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
mkdir -p "$WORK/public" "$WORK/functions"
rsync -a --exclude .DS_Store "$ROOT/public/" "$WORK/public/"
cp "$ROOT/review-deploy/functions/_middleware.ts" "$WORK/functions/"
printf '/*\n  X-Robots-Tag: noindex, nofollow\n' > "$WORK/public/_headers"
cd "$WORK"
CLOUDFLARE_ACCOUNT_ID=97480f45e49cdcee83ae5545af00c36a npx wrangler pages deploy public \
  --project-name villa-azure-hotel --branch review --commit-dirty=true
rm -rf "$WORK"
