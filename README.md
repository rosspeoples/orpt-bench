# ORPT-Bench

OpenCode Agentic Efficiency Benchmark measures how many OpenCode requests a model consumes per successful task on reproducible DevOps and light-coding fixtures.

Model pricing in this repo is generated for benchmark use during `sync-models`. The normalized catalog keeps both the actual listed blended price and, when useful, a clearly labeled reference blended price for free variants derived from a paid sibling or nearby family model.

## Model Summary

| Rank | Model | Score | Value Score | Composite Score | Success Rate | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | opencode/gpt-5.4-mini | 0.11 | 0.111 | 0.111 | 11% | 97 | 8.00 | 589.0 | 0.0283 | yes | yes |  |

## Limited Comparability

The following models are included for transparency but excluded from the primary comparable cohort when they have known benchmark-affecting feature limitations such as incomplete unattended-run support.

| Rank | Model | Score | Value Score | Composite Score | Success Rate | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| - | No runs yet | - | - | - | - | - | - | - | - | - | - | - |

## Task Detail

| Task | Model | Score | Value Score | Composite Score | Success Rate | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 11 | 11.00 | 44.1 | 0.0024 | 1.00 | yes |  |
| 02-terraform-static-site | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 6 | 6.00 | 58.6 | 0.0038 | 1.00 | yes |  |
| 03-ansible-nginx-role | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 9 | 9.00 | 61.9 | 0.0020 | 1.00 | yes |  |
| 04-docker-compose-observability | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 15 | 15.00 | 93.0 | 0.0070 | 1.00 | yes |  |
| 05-log-audit-script | opencode/gpt-5.4-mini | 1.00 | 1.000 | 1.000 | 100% | 8 | 8.00 | 33.9 | 0.0019 | 1.00 | yes |  |
| 06-kubernetes-oidc-rbac-repair | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 14 | 14.00 | 105.4 | 0.0029 | 1.00 | yes |  |
| 07-cnpg-restore-manifest-repair | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 13 | 13.00 | 63.0 | 0.0042 | 1.00 | yes |  |
| 08-workspace-transplant-bundle-repair | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 14 | 14.00 | 89.5 | 0.0023 | 1.00 | yes |  |
| 09-gitops-workspace-render-validation | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 7 | 7.00 | 39.6 | 0.0019 | 1.00 | yes |  |

## Task Detail: Limited Comparability

| Task | Model | Score | Value Score | Composite Score | Success Rate | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| No runs yet | - | - | - | - | - | - | - | - | - | - | - | - |

## Value Score

Value Score is a secondary efficiency metric. It does not replace correctness.

- `Score` remains binary task correctness: pass = `1`, fail = `0`.
- `Value Score` is computed only from successful comparable runs.
- It combines normalized request efficiency, actual observed cost, and wall time using a weighted geometric mean.
- Current weights: ORPT `0.45`, cost `0.35`, time `0.20`.
- Failed or non-comparable runs receive `0.000`.

## Composite Score

Composite Score blends correctness and efficiency.

- `Composite Score = 0.70 * Score + 0.30 * Value Score`.
- This keeps correctness dominant while still rewarding efficient successful runs.
- Comparable model rankings are sorted by `Composite Score`, with ORPT used as a tie-breaker.

## Value Score Components

| Task | Model | Value Score | ORPT Factor | Cost Factor | Time Factor |
| --- | --- | --- | --- | --- | --- |
| 05-log-audit-script | opencode/gpt-5.4-mini | 1.000 | 1.000 | 1.000 | 1.000 |

## Pricing Provenance

| Model | Benchmark Price $/1M | Reference Price $/1M | Price Source | Price Type | Price Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| opencode/gpt-5.4-mini | 1.6875 | n/a | openrouter | automatic-openrouter-primary | medium | Primary blended price derived automatically from OpenRouter listing openai/gpt-5.4-mini using a 3:1 input:output blend. |

## Capability Coverage

- Fully comparable models for the current task set: opencode/gpt-5.4-mini
- Models with limited comparability: none
- Task set capability requirements: unattendedBenchmarkRuns


### Capability Matrix

| Capability | Required By Tasks | Supported Models | Limited Models | Unsupported Models | Unknown Models |
| --- | --- | --- | --- | --- | --- |
| unattendedBenchmarkRuns | 01-iac-kubernetes-rollout, 02-terraform-static-site, 03-ansible-nginx-role, 04-docker-compose-observability, 05-log-audit-script, 06-kubernetes-oidc-rbac-repair, 07-cnpg-restore-manifest-repair, 08-workspace-transplant-bundle-repair, 09-gitops-workspace-render-validation | opencode/gpt-5.4-mini | - | - | - |

Charts:

- [ORPT leaderboard](results/charts/orpt.html)
- [Success rate](results/charts/success-rate.html)
- [Composite score](results/charts/composite-score.html)
- [Model catalog](models/README.md)

## Included Tasks

1. Kubernetes rollout repair
2. Terraform static site repair
3. Ansible nginx role completion
4. Docker Compose observability fix
5. Log audit shell script
6. Kubernetes OIDC RBAC repair
7. CNPG restore manifest repair
8. Workspace transplant bundle repair
9. GitOps workspace render validation

## Task Requirements

| Task | Required Capabilities |
| --- | --- |
| 01-iac-kubernetes-rollout | unattendedBenchmarkRuns |
| 02-terraform-static-site | unattendedBenchmarkRuns |
| 03-ansible-nginx-role | unattendedBenchmarkRuns |
| 04-docker-compose-observability | unattendedBenchmarkRuns |
| 05-log-audit-script | unattendedBenchmarkRuns |
| 06-kubernetes-oidc-rbac-repair | unattendedBenchmarkRuns |
| 07-cnpg-restore-manifest-repair | unattendedBenchmarkRuns |
| 08-workspace-transplant-bundle-repair | unattendedBenchmarkRuns |
| 09-gitops-workspace-render-validation | unattendedBenchmarkRuns |

## Quickstart

```bash
cp .env.benchmark.example .env.benchmark
# add OPENCODE_API_KEY=... to .env
docker compose build
docker compose run --rm runner sync-models
docker compose run --rm runner validate
docker compose run --rm runner benchmark
```

For cheaper development runs, use the generated `dev` or `cheap_headless` matrix from `models/MATRICES.md`.
Use `docker compose run --rm runner use-matrix dev` for the smallest proven headless dev cohort, or `docker compose run --rm runner use-matrix cheap_headless` when you want a low-cost comparable cohort.

Environment variables:

- `BENCHMARK_MODELS`: comma-separated model matrix
- `BENCHMARK_REPEATS`: repeat count per task/model
- `BENCHMARK_TASK_GLOB`: task subset filter
- `BENCHMARK_PROCESS_TIMEOUT_SECONDS`: hard timeout for the benchmark process during development; keep `0` for full real benchmark runs
- `BENCHMARK_WRITE_README`: write generated README and charts

## Model Inventory

Refresh the available-model list and enrichment data:

```bash
docker compose run --rm runner sync-models
```

Generated artifacts:

- `models/catalog.json`: normalized model inventory with enrichment
- `models/catalog.openrouter.raw.json`: raw OpenRouter pricing snapshot used for automatic cost enrichment
- `models/catalog.latest.raw.json`: raw OpenCode inventory snapshot
- `models/catalog.index.json`: compact matrix-selection and pricing provenance view
- `models/excluded.json`: denylist for models that should stay in inventory but out of generated benchmark matrices
- `models/README.md`: human-readable model table
- `models/matrices.json`: recommended benchmark matrices
- `models/MATRICES.md`: human-readable recommended matrices

Manual enrichment inputs:

- `data/model-benchmarks.manual.json`: checked-in intelligence, speed, and selected benchmark metadata
- `data/model-stability.manual.json`: checked-in stability and capability annotations

The current enrichment path combines checked-in manual benchmark/stability data with automatic pricing enrichment and can be extended with stable benchmark adapters as reliable machine-readable sources become available.

You can print a recommended matrix directly:

```bash
docker compose run --rm runner select-matrix dev
docker compose run --rm runner select-matrix release
```

Or apply one to .env.benchmark automatically:

```bash
docker compose run --rm runner use-matrix dev
```

Useful smoke-test example:

```bash
BENCHMARK_MODELS=opencode/gpt-5.4-mini BENCHMARK_TASK_GLOB=05* docker compose run --rm runner benchmark
```

## Artifact Summary

- Models in latest result: 1
- Distinct tasks exercised: 9
- Total task runs: 9
- Successful task runs: 1

## Design

See [DESIGN.md](DESIGN.md) for benchmark architecture, telemetry rules, and CI behavior.
