# Model Summary

| Rank | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| - | No runs yet | - | - | - | - | - | - | - | - | - | - | - | - |

# Limited Comparability

| Rank | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 1 | n/a | 59.7 | 0.0000 | no | no | unattendedBenchmarkRuns: limited |

# Task Detail

| Task | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| No runs yet | - | - | - | - | - | - | - | - | - | - | - | - | - |

# Task Detail: Limited Comparability

| Task | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 05-log-audit-script | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 1 | 1.00 | 59.7 | 0.0000 | 1.00 | no | unattendedBenchmarkRuns: limited |

# Scoring

- `Score` is binary correctness.
- `Value Score` is the secondary efficiency metric based on ORPT, actual observed cost, and wall time.
- `Composite Score = 0.70 * Score + 0.30 * Value Score`.
- Comparable model rankings are sorted by `Composite Score`, with ORPT as a tie-breaker.

# Value Score Components

| Task | Model | Value Score | ORPT Factor | Cost Factor | Time Factor |
| --- | --- | --- | --- | --- | --- |
| No successful comparable runs yet | - | - | - | - | - |

# Pricing Provenance

| Model | Benchmark Price $/1M | Reference Price $/1M | Price Source | Price Type | Price Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| opencode/nemotron-3-super-free | 0 | 0.2 | artificial-analysis | manual-primary-with-openrouter-reference | high | OpenRouter reference blend for nvidia/nemotron-3-super-120b-a12b:free is 0 USD per 1M tokens using a 3:1 input:output mix. Reference price uses nvidia/nemotron-3-super-120b-a12b at 0.2 USD per 1M tokens from the same OpenRouter family. |

## Capability Coverage

- Fully comparable models for the current task set: none
- Models with limited comparability: opencode/nemotron-3-super-free
- Task set capability requirements: unattendedBenchmarkRuns

Known exclusions by model:
- opencode/nemotron-3-super-free: 05-log-audit-script (unattendedBenchmarkRuns: limited)


## Capability Matrix

| Capability | Required By Tasks | Supported Models | Limited Models | Unsupported Models | Unknown Models |
| --- | --- | --- | --- | --- | --- |
| unattendedBenchmarkRuns | 01-iac-kubernetes-rollout, 02-terraform-static-site, 03-ansible-nginx-role, 04-docker-compose-observability, 05-log-audit-script, 06-kubernetes-oidc-rbac-repair, 07-cnpg-restore-manifest-repair, 08-workspace-transplant-bundle-repair, 09-gitops-workspace-render-validation, 10-bootstrap-phase-validation-repair, 11-mcp-openbao-contract-repair, 12-pre-argocd-bootstrap-sequencing, 13-wildcard-tls-route-coverage, 14-build-workspace-plane-convergence, 15-workspace-runtime-access-convergence | - | opencode/nemotron-3-super-free | - | - |
