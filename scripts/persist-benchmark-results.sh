#!/usr/bin/env bash

set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf 'not inside a git worktree; refusing to persist benchmark artifacts\n' >&2
  exit 1
fi

branch="${1:-${GITHUB_REF_NAME:-main}}"
message="${2:-Update ORPT benchmark results}"

benchmark_paths=(
  "results"
  "models"
  "README.md"
  "DESIGN.md"
  "benchmark.config.json"
  "docs/result-schema.json"
  "docs/benchmark-operations-policy.md"
  "docs/github-pages-publication.md"
  ".github/workflows/benchmark.yml"
  ".github/workflows/manage-models.yml"
  ".gitea/workflows/benchmark.yml"
  ".gitea/workflows/manage-models.yml"
  ".gitea/workflows/github-publication.yml"
  "scripts/persist-benchmark-results.sh"
  "scripts/run-overnight-cheap-zen.sh"
  "scripts/run-full-benchmark.sh"
  "scripts/lib"
  "tests"
)

existing_benchmark_paths=()
for path in "${benchmark_paths[@]}"; do
  if [[ -e "${path}" ]]; then
    existing_benchmark_paths+=("${path}")
  fi
done

export GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-gitea-actions}"
export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-gitea-actions@localhost}"
export GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-${GIT_AUTHOR_NAME}}"
export GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-${GIT_AUTHOR_EMAIL}}"

if [[ ${#existing_benchmark_paths[@]} -gt 0 ]]; then
  git add -- "${existing_benchmark_paths[@]}"
fi

if git diff --cached --quiet; then
  printf 'no benchmark artifact or workflow changes to persist\n'
  exit 0
fi

git commit -m "${message}"
git push origin "HEAD:${branch}"
