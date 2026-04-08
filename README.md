# ORPT-Bench

OpenCode Agentic Efficiency Benchmark measures how many OpenCode requests a model consumes per successful task on reproducible DevOps and light-coding fixtures.

The suite is intended for senior-level platform and infrastructure repair work. One control task provides a basic sanity check, while the scored benchmark should otherwise skew toward medium/high difficulty and reward models that can sustain real multi-step investigation loops.

Model pricing in this repo is generated for benchmark use during `sync-models`. The normalized catalog keeps both the actual listed blended price and, when useful, a clearly labeled reference blended price for free variants derived from a paid sibling or nearby family model.

## Live Results

- Live benchmark site: <https://rosspeoples.github.io/orpt-bench/>
- Latest raw results: `results/latest.json`
- Historical raw results: `results/history/*.json`

The GitHub Pages publication is the canonical place for dynamic benchmark output:

- chart-first summaries for composite score, success rate, and ORPT
- sortable comparison tables that default to composite score
- links to raw JSON artifacts, the result schema, and deeper docs
- historical snapshot links when archived runs are available

## Scoring

- `Score` remains binary correctness: pass = `1`, fail = `0`
- `Value Score` is a secondary efficiency metric computed only from successful comparable runs
- `Value Score` combines normalized ORPT, actual observed cost, and wall time using a weighted geometric mean
- Current value weights: ORPT `0.45`, cost `0.35`, time `0.20`
- Failed or non-comparable runs receive `0.000`
- `Composite Score = 0.70 * Score + 0.30 * Value Score`
- Comparable rankings sort by `Composite Score`, with ORPT used as a tie-breaker

## Benchmark Shape

- The task set is intentionally weighted toward real repair-oriented DevOps work rather than toy prompts
- Capability gating matters: models with benchmark-affecting limitations can be surfaced, but excluded from the primary comparable cohort when appropriate
- Tasks live under `tasks/*`, each with its own fixture, prompt, and verifier

Included task areas:

- Kubernetes and GitOps repair
- Terraform and Ansible completion or fixup
- Docker Compose observability repair
- Shell scripting and workspace bundle repair
- Bootstrap sequencing and platform validation

## Included Tasks

- Difficulty mix: control=1, medium=1, high=7, expert=6

1. Kubernetes rollout repair (01-iac-kubernetes-rollout, medium)
2. Terraform static site repair (02-terraform-static-site, high)
3. Ansible nginx role completion (03-ansible-nginx-role, high)
4. Docker Compose observability fix (04-docker-compose-observability, high)
5. Log audit shell script (05-log-audit-script, control)
6. Kubernetes OIDC RBAC repair (06-kubernetes-oidc-rbac-repair, high)
7. CNPG restore manifest repair (07-cnpg-restore-manifest-repair, high)
8. Workspace transplant bundle repair (08-workspace-transplant-bundle-repair, high)
9. GitOps workspace render validation (09-gitops-workspace-render-validation, high)
10. Bootstrap phase validation repair (10-bootstrap-phase-validation-repair, expert)
11. MCP OpenBao contract repair (11-mcp-openbao-contract-repair, expert)
12. Pre-ArgoCD bootstrap sequencing (12-pre-argocd-bootstrap-sequencing, expert)
13. Wildcard TLS route coverage (13-wildcard-tls-route-coverage, expert)
14. Build workspace plane convergence (14-build-workspace-plane-convergence, expert)
15. Workspace runtime access convergence (15-workspace-runtime-access-convergence, expert)

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

Durable publication-quality full run:

```bash
BENCHMARK_MODELS=opencode/glm-5 bash scripts/run-full-benchmark.sh
bash scripts/persist-benchmark-results.sh main "publish manual benchmark results"
```

Durable overnight cheap-Zen sweep:

```bash
nohup bash scripts/run-overnight-cheap-zen.sh > .tmp/logs/overnight-launch.out 2>&1 &
```

Generated benchmark artifacts are written to `results/` locally. Use the live Pages site for published rankings, tables, and history rather than checking volatile result tables into the root README.

## Design

See [DESIGN.md](DESIGN.md) for benchmark architecture, telemetry rules, and CI behavior.
See [docs/result-schema.json](docs/result-schema.json) for the benchmark result contract.
See <https://rosspeoples.github.io/orpt-bench/> for the live published leaderboard, charts, and history.
