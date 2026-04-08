#!/usr/bin/env bash

set -euo pipefail

set -a
source ./.env.benchmark
set +a

# Full publication-quality runs must never inherit the dev process timeout.
export BENCHMARK_PROCESS_TIMEOUT_SECONDS=0

exec docker compose run --rm \
  -e BENCHMARK_MODELS \
  -e BENCHMARK_REPEATS \
  -e BENCHMARK_PROVIDER \
  -e BENCHMARK_AGENT \
  -e BENCHMARK_TASK_GLOB \
  -e BENCHMARK_TIMEOUT_SECONDS \
  -e BENCHMARK_PROCESS_TIMEOUT_SECONDS \
  -e BENCHMARK_WRITE_README \
  -e BENCHMARK_MODEL_CONCURRENCY \
  -e BENCHMARK_PROVIDER_OVERRIDES_JSON \
  -e BENCHMARK_CYCLE \
  runner benchmark "$@"
