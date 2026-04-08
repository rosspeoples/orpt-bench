#!/usr/bin/env bash

set -euo pipefail

benchmark_env_vars=(
  BENCHMARK_MODELS
  BENCHMARK_REPEATS
  BENCHMARK_PROVIDER
  BENCHMARK_AGENT
  BENCHMARK_TASK_GLOB
  BENCHMARK_TIMEOUT_SECONDS
  BENCHMARK_PROCESS_TIMEOUT_SECONDS
  BENCHMARK_WRITE_README
  BENCHMARK_MODEL_CONCURRENCY
  BENCHMARK_PROVIDER_OVERRIDES_JSON
  BENCHMARK_CYCLE
)

declare -A provided_env=()
for name in "${benchmark_env_vars[@]}"; do
  if [[ ${!name+x} ]]; then
    provided_env["$name"]="${!name}"
  fi
done

if [[ -f ./.env.benchmark ]]; then
  set -a
  source ./.env.benchmark
  set +a
fi

for name in "${!provided_env[@]}"; do
  export "$name=${provided_env[$name]}"
done

# Full publication-quality runs must never inherit the dev process timeout.
export BENCHMARK_PROCESS_TIMEOUT_SECONDS=0

printf '%s\n' "Full benchmark preflight: models=${BENCHMARK_MODELS:-<unset>} task_glob=${BENCHMARK_TASK_GLOB:-<unset>} repeats=${BENCHMARK_REPEATS:-<unset>} task_timeout=${BENCHMARK_TIMEOUT_SECONDS:-<unset>} process_timeout=${BENCHMARK_PROCESS_TIMEOUT_SECONDS}" >&2

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
