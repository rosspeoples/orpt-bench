#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(pwd)"
STAMP="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
LOG_DIR="${ROOT_DIR}/.tmp/logs/overnight-cheap-${STAMP}"
SUMMARY_FILE="${LOG_DIR}/summary.tsv"
PASSERS_FILE="${LOG_DIR}/smoke-passers.txt"
BRANCH_NAME="${GITHUB_REF_NAME:-main}"

mkdir -p "${LOG_DIR}"

MODELS=(
  "opencode/glm-5"
  "opencode/gemini-3.1-pro"
  "opencode/gemini-3-pro"
  "opencode/gpt-5-nano"
  "opencode/gpt-5.1-codex-mini"
  "opencode/gpt-5.4-nano"
  "opencode/minimax-m2.1"
  "opencode/minimax-m2.5"
  "opencode/qwen3.6-plus-free"
  "opencode/trinity-large-preview-free"
  "opencode/claude-3-5-haiku"
  "opencode/claude-haiku-4-5"
)

printf 'model\tsmoke_status\trun_id\tduration_ms\trequest_units\tcost_usd\tnote\n' >"${SUMMARY_FILE}"
: >"${PASSERS_FILE}"

extract_latest_field() {
  local jq_expr="$1"
  jq -r "${jq_expr}" "${ROOT_DIR}/results/latest.json"
}

persist_checkpoint() {
  local message="$1"
  if ! bash scripts/persist-benchmark-results.sh "${BRANCH_NAME}" "${message}" >>"${LOG_DIR}/runner.log" 2>&1; then
    printf '[%s] persist failed: %s\n' "$(date -u +%FT%TZ)" "${message}" | tee -a "${LOG_DIR}/runner.log"
  fi
}

run_smoke() {
  local model="$1"
  local slug
  slug="$(printf '%s' "${model}" | tr '/.' '--')"
  local smoke_log="${LOG_DIR}/smoke-${slug}.log"

  printf '[%s] smoke %s\n' "$(date -u +%FT%TZ)" "${model}" | tee -a "${LOG_DIR}/runner.log"

  if BENCHMARK_MODELS="${model}" \
    BENCHMARK_TASK_GLOB='05*' \
    BENCHMARK_CYCLE='candidate_smoke' \
    BENCHMARK_REPEATS=1 \
    BENCHMARK_PROCESS_TIMEOUT_SECONDS=0 \
    BENCHMARK_WRITE_README=0 \
    docker compose run --rm \
      -e BENCHMARK_MODELS \
      -e BENCHMARK_TASK_GLOB \
      -e BENCHMARK_CYCLE \
      -e BENCHMARK_REPEATS \
      -e BENCHMARK_PROCESS_TIMEOUT_SECONDS \
      -e BENCHMARK_WRITE_README \
      runner benchmark >"${smoke_log}" 2>&1; then
    :
  else
    printf '[%s] smoke command failed for %s\n' "$(date -u +%FT%TZ)" "${model}" | tee -a "${LOG_DIR}/runner.log"
  fi

  local latest_model
  latest_model="$(extract_latest_field '.results[-1].model // empty')"
  if [[ "${latest_model}" != "${model}" ]]; then
    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "${model}" "NO_ARTIFACT" "" "" "" "" "latest.json not updated for model" >>"${SUMMARY_FILE}"
    persist_checkpoint "persist overnight cheap zen smoke evidence"
    return 1
  fi

  local run_id success provider_limited dnf duration request_units cost note status
  run_id="$(extract_latest_field '.run.id')"
  success="$(extract_latest_field '.results[-1].success')"
  provider_limited="$(extract_latest_field '.results[-1].providerLimited // false')"
  dnf="$(extract_latest_field '.results[-1].dnf // false')"
  duration="$(extract_latest_field '.results[-1].durationMs // ""')"
  request_units="$(extract_latest_field '.results[-1].requestUnits // ""')"
  cost="$(extract_latest_field '.results[-1].costUsd // "unknown"')"
  note="$(extract_latest_field '.results[-1].error.message // .results[-1].verifier.stderr // ""')"

  if [[ "${success}" == "true" ]]; then
    status="PASS"
    printf '%s\n' "${model}" >>"${PASSERS_FILE}"
  elif [[ "${provider_limited}" == "true" ]]; then
    status="PROVIDER_LIMITED"
  elif [[ "${dnf}" == "true" ]]; then
    status="DNF"
  else
    status="FAIL"
  fi

  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "${model}" "${status}" "${run_id}" "${duration}" "${request_units}" "${cost}" "${note}" >>"${SUMMARY_FILE}"
  printf '[%s] smoke result %s %s\n' "$(date -u +%FT%TZ)" "${model}" "${status}" | tee -a "${LOG_DIR}/runner.log"
  persist_checkpoint "persist overnight cheap zen smoke evidence"

  [[ "${status}" == "PASS" ]]
}

run_full() {
  local model="$1"
  local slug
  slug="$(printf '%s' "${model}" | tr '/.' '--')"
  local full_log="${LOG_DIR}/full-${slug}.log"

  printf '[%s] full %s\n' "$(date -u +%FT%TZ)" "${model}" | tee -a "${LOG_DIR}/runner.log"

  if BENCHMARK_MODELS="${model}" \
    BENCHMARK_TASK_GLOB='*' \
    BENCHMARK_CYCLE='weekly' \
    BENCHMARK_REPEATS=1 \
    BENCHMARK_WRITE_README=1 \
    bash scripts/run-full-benchmark.sh >"${full_log}" 2>&1; then
    printf '[%s] full result %s PASS\n' "$(date -u +%FT%TZ)" "${model}" | tee -a "${LOG_DIR}/runner.log"
  else
    printf '[%s] full result %s FAIL\n' "$(date -u +%FT%TZ)" "${model}" | tee -a "${LOG_DIR}/runner.log"
  fi

  persist_checkpoint "persist overnight cheap zen full benchmark results"
}

printf '[%s] overnight cheap zen runner start\n' "$(date -u +%FT%TZ)" | tee -a "${LOG_DIR}/runner.log"
printf '%s\n' "${LOG_DIR}" > "${ROOT_DIR}/.tmp/overnight-cheap-latest-path.txt"

for model in "${MODELS[@]}"; do
  run_smoke "${model}" || true
done

if [[ -s "${PASSERS_FILE}" ]]; then
  while IFS= read -r model; do
    [[ -n "${model}" ]] || continue
    run_full "${model}"
  done <"${PASSERS_FILE}"
fi

printf '[%s] overnight cheap zen runner finished\n' "$(date -u +%FT%TZ)" | tee -a "${LOG_DIR}/runner.log"
persist_checkpoint "persist overnight cheap zen benchmark completion"
