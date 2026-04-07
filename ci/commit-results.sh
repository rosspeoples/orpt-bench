#!/usr/bin/env bash

set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository; skipping commit"
  exit 0
fi

git add README.md results models DESIGN.md benchmark.config.json tasks .github/workflows .gitea/workflows || true

if git diff --cached --quiet; then
  echo "No generated changes to commit"
  exit 0
fi

git commit -m "Update ORPT benchmark results"
