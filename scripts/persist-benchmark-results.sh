#!/usr/bin/env bash

set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf 'not inside a git worktree; refusing to persist benchmark artifacts\n' >&2
  exit 1
fi

branch="${1:-${GITHUB_REF_NAME:-main}}"
message="${2:-Update ORPT benchmark results}"

export GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-gitea-actions}"
export GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-gitea-actions@localhost}"
export GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-${GIT_AUTHOR_NAME}}"
export GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-${GIT_AUTHOR_EMAIL}}"

git add README.md results models DESIGN.md benchmark.config.json tasks .github/workflows .gitea/workflows docs scripts tests ci || true

if git diff --cached --quiet; then
  printf 'no benchmark artifact or workflow changes to persist\n'
  exit 0
fi

git commit -m "${message}"
git push origin "HEAD:${branch}"
