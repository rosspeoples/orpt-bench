#!/usr/bin/env bash

set -euo pipefail

if [ ! -d /workspace/node_modules/ajv ]; then
  npm install --no-fund --no-audit
fi

if [ -n "${BENCHMARK_PROCESS_TIMEOUT_SECONDS:-}" ] && [ "${BENCHMARK_PROCESS_TIMEOUT_SECONDS}" != "0" ]; then
  if [ "${1:-}" = "benchmark-single" ]; then
    exec timeout --signal=TERM --kill-after=10s "${BENCHMARK_PROCESS_TIMEOUT_SECONDS}s" node scripts/cli.js "$@"
  fi

  if [ "${1:-}" = "benchmark" ]; then
    case "${BENCHMARK_MODELS:-}" in
      *,*) ;;
      *) exec timeout --signal=TERM --kill-after=10s "${BENCHMARK_PROCESS_TIMEOUT_SECONDS}s" node scripts/cli.js "$@" ;;
    esac
  fi
fi

exec node scripts/cli.js "$@"
