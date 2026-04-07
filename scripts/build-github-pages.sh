#!/usr/bin/env bash

set -euo pipefail

output_dir="${PUBLISH_PAGES_OUTPUT_DIR:-${GITHUB_PAGES_OUTPUT_DIR:-}}"
[[ -n "${output_dir}" ]] || {
  printf 'missing PUBLISH_PAGES_OUTPUT_DIR or GITHUB_PAGES_OUTPUT_DIR\n' >&2
  exit 1
}

mkdir -p "${output_dir}/results/charts" "${output_dir}/results/history" "${output_dir}/models" "${output_dir}/docs"

cp "results/leaderboard.md" "${output_dir}/leaderboard.md"
cp -a "results/charts/." "${output_dir}/results/charts/"
cp "results/latest.json" "${output_dir}/results/latest.json"
cp -a "results/history/." "${output_dir}/results/history/"
cp "models/README.md" "${output_dir}/models/index.md"
cp "docs/result-schema.json" "${output_dir}/docs/result-schema.json"
cp "DESIGN.md" "${output_dir}/docs/design.md"

node "scripts/lib/build-github-pages.js"
