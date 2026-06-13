#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

npm run build >/dev/null

out_dir="${TMPDIR:-/tmp}/agentprimer-demo"
mkdir -p "$out_dir"

node dist/src/index.js scan fixtures/node-cli \
  --deterministic \
  --out "$out_dir/node-cli-primer.md"

node dist/src/index.js suggest-task fixtures/sparse-repo \
  --max-risk low \
  --deterministic \
  --out "$out_dir/sparse-task.md"

node dist/src/index.js scan fixtures/python-package \
  --format json \
  --deterministic > "$out_dir/python-package.json"

grep -q 'Agent Primer: fixture-node-cli' "$out_dir/node-cli-primer.md"
grep -q 'Suggested First Task' "$out_dir/sparse-task.md"
grep -q '"name": "python-package"' "$out_dir/python-package.json"

printf 'wrote primer packet files under %s\n' "$out_dir"
