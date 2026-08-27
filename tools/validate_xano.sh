#!/usr/bin/env bash
set -euo pipefail

project_root=$(cd "$(dirname "$0")/.." && pwd)
validator_dir=$(mktemp -d)
trap 'rm -rf -- "$validator_dir"' EXIT

npm install \
  --prefix "$validator_dir" \
  --no-save \
  --package-lock=false \
  --silent \
  @xano/developer-mcp@2.2.5

XANO_VALIDATOR_PATH="$validator_dir/node_modules/@xano/developer-mcp/dist/lib.js" \
XANO_SOURCE_DIR="$project_root/xano" \
  node "$project_root/tools/validate-xano.mjs"
