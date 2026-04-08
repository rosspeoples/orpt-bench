#!/usr/bin/env bash

set -euo pipefail

# Full publication-quality runs must never inherit the dev process timeout.
export BENCHMARK_PROCESS_TIMEOUT_SECONDS=0

exec docker compose run --rm \
  -e BENCHMARK_PROCESS_TIMEOUT_SECONDS \
  runner benchmark "$@"
