#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd -P)"
output_dir="$repo_root/output"
archive="$output_dir/workday-autofill-assistant-recruiter.zip"
stage_dir="$(mktemp -d)"
trap 'rm -rf "$stage_dir"' EXIT

cd "$repo_root/extension"
npm test
npx tsc --noEmit
npm run build

cd "$repo_root/backend"
.venv/bin/pytest tests -q

cd "$repo_root"
mkdir -p "$output_dir"
git archive HEAD | tar -x -C "$stage_dir"
mkdir -p "$stage_dir/extension/dist"
cp -R "$repo_root/extension/dist/." "$stage_dir/extension/dist/"

if find "$stage_dir" -type f \( -name '.env' -o -name '*.pem' -o -name '*.key' \) | grep -q .; then
  echo "Refusing to package secret-bearing files." >&2
  exit 1
fi
if grep -R -E 'AIza[0-9A-Za-z_-]{20,}|BEGIN (RSA |EC )?PRIVATE KEY' "$stage_dir" >/dev/null 2>&1; then
  echo "Refusing to package content that resembles a secret." >&2
  exit 1
fi

rm -f "$archive"
(cd "$stage_dir" && zip -qr "$archive" .)
echo "$archive"
