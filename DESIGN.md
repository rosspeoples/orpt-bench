# ORPT-Bench Design

## Goal

ORPT-Bench measures agentic efficiency inside OpenCode using a task-oriented metric:

- `requests_per_successful_task`

The benchmark answers a practical question: how many OpenCode requests does a model consume to finish real infrastructure and scripting work successfully?

The benchmark is intentionally opinionated:

- one control task exists for basic tool/runtime validation
- the scored suite should otherwise skew toward medium/high difficulty
- future growth should add explicit expert-tier tasks
- ORPT should reflect real investigation and repair loops, not verifier scraping or one-file literal patching

## Primary Metric

For a benchmark run:

- `successful_tasks`: count of tasks whose verifier returns success
- `request_units`: sum of request units observed for the model across all tasks in the run
- `ORPT = request_units / successful_tasks`

Secondary metrics:

- success rate
- median wall time per task
- median OpenCode steps per task
- median token usage per successful task
- median cost per successful task
- `valueScore`: normalized efficiency score derived from request units, observed cost, and wall time
- `compositeScore`: correctness-first blend of `score` and `valueScore`

If request-unit accounting is unavailable from the provider path, the run is marked `request_accounting="unavailable"` and excluded from the ORPT leaderboard while still preserving other telemetry.

## Constraints

- Container-first execution for portability
- No dependency on host-installed `opencode`
- Reproducible task fixtures committed to the repo
- Headless execution via OpenCode server + SDK/API
- Non-interactive CI operation
- Benchmark artifacts committed back to the repo by automation

## Architecture

The repository is split into five layers.

### 1. Task specifications

Each task lives under `tasks/<id-name>/` and contains:

- `task.json`: metadata, prompt, verifier command, timeouts, expected tools
- `workspace/`: initial files copied into an isolated run directory
- `README.md`: human description

Each task is designed to be:

- realistic for senior platform engineering work
- difficult enough to expose weak models quickly
- grounded in local source-of-truth artifacts such as runbooks, handoff notes, or request specs
- verifiable by deterministic semantic checks, not just raw substring matches
- independent from external cloud credentials
- still small enough for CI, but large enough to require non-trivial investigation

### 2. Runner container

The runner image contains:

- Node.js 22
- `opencode-ai`
- `@opencode-ai/sdk`
- benchmark scripts
- lightweight verification dependencies like `python3`, `bash`, `jq`, and `git`

At runtime the runner:

1. reads benchmark config and model matrix
2. writes an inline OpenCode config through `OPENCODE_CONFIG_CONTENT`
3. starts `opencode serve`
4. creates a fresh isolated copy of each task workspace
5. creates a session for that task directory
6. submits the benchmark prompt with the requested model
7. waits for session completion using events and status polling
8. captures telemetry from messages, parts, logs, and response headers
9. runs the task verifier
10. emits JSON results and regenerates reports

### 3. Telemetry collection

The runner records:

- wall clock start and end
- session id
- model provider and model id
- success/failure
- step count from `step-finish` parts
- tokens and provider cost from assistant messages
- tool counts from tool parts
- file diffs from session summary/diff

Request-unit accounting is provider-sensitive, so the benchmark uses layered extraction.

Order of preference:

1. configured response headers from provider/API responses
2. structured metadata captured in OpenCode `APIError` or message/tool metadata
3. server log parsing rules
4. exact upstream provider call count observed by the recording proxy
5. explicit `null` when unavailable

This is implemented through pluggable extractors. The default config includes extractors for likely OpenCode Go/Zen style headers and log lines, but keeps the parser configurable because providers can evolve independently.

## Request accounting model

The benchmark is intentionally strict:

- only exact observed request values count toward ORPT
- exact provider call count from the recording proxy is accepted when the provider exposes no separate quota header
- inferred values are never mixed into the official leaderboard
- if a run cannot extract request data at all, it remains visible in raw results but is tagged as not leaderboard-eligible

This avoids presenting a made-up ORPT number.

## Task set

Fourteen deterministic tasks are currently included.

Difficulty intent:

- `control`: simple sanity check for basic model/tooling validation
- `medium`: meaningful multi-file repair with some local source-of-truth discovery
- `high`: senior-level platform repair expected to require broad search, synthesis, and iterative validation
- `expert`: reserved for future fixtures that should challenge even frontier models heavily

1. `01-iac-kubernetes-rollout`
   Fix a Kubernetes deployment/service/ingress rollout issue.
   Intended difficulty: `medium`

2. `02-terraform-static-site`
   Repair and complete a Terraform module for a static site stack.
   Intended difficulty: `high`

3. `03-ansible-nginx-role`
   Finish an Ansible role that configures nginx with a templated vhost.
   Intended difficulty: `high`

4. `04-docker-compose-observability`
   Fix a Docker Compose stack for app + metrics + healthchecks.
   Intended difficulty: `high`

5. `05-log-audit-script`
   Implement a shell script that audits log files and emits a JSON summary.
   Intended difficulty: `control`

6. `06-kubernetes-oidc-rbac-repair`
   Repair Kubernetes API OIDC settings and namespace-scoped RBAC bindings.
   Intended difficulty: `high`

7. `07-cnpg-restore-manifest-repair`
   Fix a CloudNativePG restore manifest so it follows safe recovery and backup-contract rules.
   Intended difficulty: `high`

8. `08-workspace-transplant-bundle-repair`
   Repair a portable workspace transplant helper so it preserves durable state while excluding transient runtime data.
   Intended difficulty: `high`

9. `09-gitops-workspace-render-validation`
   Repair a workspace request, provider record, and rendered GitOps manifests so source-of-truth and rendered resources are consistent.
   Intended difficulty: `high`

10. `10-bootstrap-phase-validation-repair`
   Repair the phase-specific validation flow for bootstrap-era Gitea automation.
   Intended difficulty: `expert`

11. `11-mcp-openbao-contract-repair`
   Repair the Build workspace MCP provider, registry, and OpenBao target contract.
   Intended difficulty: `expert`

12. `12-pre-argocd-bootstrap-sequencing`
   Repair the documented pre-ArgoCD bootstrap sequencing across wrapper and playbooks.
   Intended difficulty: `expert`

13. `13-wildcard-tls-route-coverage`
   Repair wildcard TLS and route host coverage for the Build lane.
   Intended difficulty: `expert`

14. `14-build-workspace-plane-convergence`
   Repair the Build workspace request, raw catalogs, generated registry, and rendered manifests so the workspace plane converges on a single contract.
   Intended difficulty: `expert`

Each verifier checks repository state or script output, not subjective prose. Verifiers should prefer semantic parsing and tool-based validation over answer-key substring matching.

## Session configuration

The runner uses a benchmark-specific OpenCode config with these defaults:

- sharing disabled
- autoupdate disabled
- snapshot enabled
- default agent `build`
- permissive tool permissions inside the isolated workspace
- small model set equal to the main model when practical to reduce hidden variability

The runner can optionally override:

- provider config
- model variant
- agent step limit
- per-task timeout

## Isolation model

Each task run gets its own directory under `.tmp/runs/<run-id>/<task-id>/<model-slug>/workspace`.

This prevents:

- cross-task contamination
- stale generated files affecting later runs
- one model run influencing another

The runner never mutates the canonical fixture under `tasks/*/workspace`.

## Result schema

Raw results are written to:

- `results/latest.json`
- `results/history/<timestamp>.json`

Each task result contains:

- task id
- model id
- provider id
- run id
- session id
- success
- verifier output
- duration_ms
- steps
- tokens
- cost_usd
- request_units
- request_accounting_source
- tool_invocations
- files_changed
- started_at
- completed_at

Aggregates contain:

- success rate
- average requests per successful task
- average duration for successful tasks
- medians for steps/tokens/cost
- `valueScore`
- `compositeScore`
- leaderboard eligibility

## Reporting

Generated outputs:

- `README.md`: project overview + live leaderboard + quickstart
- `results/leaderboard.md`: standalone table
- `results/charts/*.html`: Plotly charts
- `results/charts/*.json`: chart data

The README is generated from templates and raw results so it stays consistent.

## CI/CD

GitHub Actions and Gitea-compatible workflows support:

- manual dispatch
- scheduled runs
- matrix over models from repo config or workflow input
- artifact upload
- optional commit of refreshed `results/*` and `README.md`

The workflow runs entirely in Docker Compose to preserve parity with local runs.

## Local developer workflow

Primary commands:

- `docker compose build`
- `docker compose run --rm runner benchmark`
- `docker compose run --rm runner benchmark --models opencode/gpt-5.4,opencode/gpt-5.4-mini`
- `docker compose run --rm runner report`

## Non-goals for MVP

- Perfect normalization across providers with incompatible accounting models
- Cloud resource provisioning against real accounts
- Parallel in-task agent races
- Statistical confidence intervals over large sample counts

These can be added later once the baseline benchmark is stable.

## Risks and mitigations

### Request-unit extraction drift

Risk:
provider headers or logs change.

Mitigation:
extractors are config-driven and raw headers/log excerpts are preserved in artifacts.

### Hidden model variability

Risk:
title or summary models skew request counts.

Mitigation:
benchmark config aligns `small_model` to the benchmarked model where possible.

### Non-deterministic agent behavior

Risk:
models may produce different edits between runs.

Mitigation:
tasks are verifier-driven and results are averaged across repeated scheduled runs.

### CI environment differences

Risk:
local and CI disagree.

Mitigation:
the runner is always executed in the same container image.

## MVP completion definition

The MVP is complete when this repo can:

1. build the benchmark runner container
2. execute the five included tasks against at least one configured model
3. produce raw results plus generated reports
4. publish a leaderboard from successful runs with valid request accounting
5. run the same flow from GitHub Actions or Gitea-compatible CI
