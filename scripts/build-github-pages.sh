#!/usr/bin/env bash

set -euo pipefail

output_dir="${PUBLISH_PAGES_OUTPUT_DIR:-${GITHUB_PAGES_OUTPUT_DIR:-}}"
[[ -n "${output_dir}" ]] || {
  printf 'missing PUBLISH_PAGES_OUTPUT_DIR or GITHUB_PAGES_OUTPUT_DIR\n' >&2
  exit 1
}

ensure_node_dependencies() {
  if npm ls --depth=0 >/dev/null 2>&1; then
    return
  fi

  printf 'installing node dependencies for Pages build\n'
  if git ls-files --error-unmatch "package-lock.json" >/dev/null 2>&1; then
    npm ci --no-fund --no-audit
  else
    npm install --no-fund --no-audit --package-lock=false
  fi
}

ensure_node_dependencies

rm -rf "${output_dir}"
mkdir -p "${output_dir}/results/charts" "${output_dir}/results/history" "${output_dir}/models" "${output_dir}/docs"

cp "results/leaderboard.md" "${output_dir}/leaderboard.md"
cp "results/latest.json" "${output_dir}/results/latest.json"
cp "models/README.md" "${output_dir}/models/index.md"
cp "docs/result-schema.json" "${output_dir}/docs/result-schema.json"
cp "DESIGN.md" "${output_dir}/docs/design.md"

node "scripts/lib/build-github-pages.js"
