# Model Summary

| Rank | Model | Score | Value Score | Composite Score | Success Rate | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | opencode/gpt-5.4-mini | 0.50 | 0.500 | 0.500 | 50% | 147 | 10.29 | 730.4 | 0.0356 | yes | yes |  |

# Limited Comparability

| Rank | Model | Score | Value Score | Composite Score | Success Rate | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| - | No runs yet | - | - | - | - | - | - | - | - | - | - | - |

# Task Detail

| Task | Model | Score | Value Score | Composite Score | Success Rate | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/gpt-5.4-mini | 1.00 | 1.000 | 1.000 | 100% | 13 | 13.00 | 54.7 | 0.0023 | 1.00 | yes |  |
| 02-terraform-static-site | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 9 | 9.00 | 39.5 | 0.0029 | 1.00 | yes |  |
| 03-ansible-nginx-role | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 10 | 10.00 | 32.0 | 0.0017 | 1.00 | yes |  |
| 04-docker-compose-observability | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 11 | 11.00 | 41.8 | 0.0022 | 1.00 | yes |  |
| 05-log-audit-script | opencode/gpt-5.4-mini | 1.00 | 1.000 | 1.000 | 100% | 5 | 5.00 | 21.6 | 0.0018 | 1.00 | yes |  |
| 06-kubernetes-oidc-rbac-repair | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 8 | 8.00 | 39.2 | 0.0032 | 1.00 | yes |  |
| 07-cnpg-restore-manifest-repair | opencode/gpt-5.4-mini | 1.00 | 1.000 | 1.000 | 100% | 13 | 13.00 | 49.9 | 0.0024 | 1.00 | yes |  |
| 08-workspace-transplant-bundle-repair | opencode/gpt-5.4-mini | 1.00 | 1.000 | 1.000 | 100% | 13 | 13.00 | 87.8 | 0.0028 | 1.00 | yes |  |
| 09-gitops-workspace-render-validation | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 11 | 11.00 | 62.4 | 0.0033 | 1.00 | yes |  |
| 10-bootstrap-phase-validation-repair | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 17 | 17.00 | 72.8 | 0.0050 | 1.00 | yes |  |
| 11-mcp-openbao-contract-repair | opencode/gpt-5.4-mini | 1.00 | 1.000 | 1.000 | 100% | 12 | 12.00 | 90.1 | 0.0030 | 1.00 | yes |  |
| 12-pre-argocd-bootstrap-sequencing | opencode/gpt-5.4-mini | 0.00 | 0.000 | 0.000 | 0% | 9 | 9.00 | 55.6 | 0.0030 | 1.00 | yes |  |
| 13-wildcard-tls-route-coverage | opencode/gpt-5.4-mini | 1.00 | 1.000 | 1.000 | 100% | 9 | 9.00 | 44.7 | 0.0020 | 1.00 | yes |  |
| 14-build-workspace-plane-convergence | opencode/gpt-5.4-mini | 1.00 | 1.000 | 1.000 | 100% | 7 | 7.00 | 38.3 | 0.0000 | 1.00 | yes |  |

# Task Detail: Limited Comparability

| Task | Model | Score | Value Score | Composite Score | Success Rate | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| No runs yet | - | - | - | - | - | - | - | - | - | - | - | - |

# Scoring

- `Score` is binary correctness.
- `Value Score` is the secondary efficiency metric based on ORPT, actual observed cost, and wall time.
- `Composite Score = 0.70 * Score + 0.30 * Value Score`.
- Comparable model rankings are sorted by `Composite Score`, with ORPT as a tie-breaker.

# Value Score Components

| Task | Model | Value Score | ORPT Factor | Cost Factor | Time Factor |
| --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/gpt-5.4-mini | 1.000 | 1.000 | 1.000 | 1.000 |
| 05-log-audit-script | opencode/gpt-5.4-mini | 1.000 | 1.000 | 1.000 | 1.000 |
| 07-cnpg-restore-manifest-repair | opencode/gpt-5.4-mini | 1.000 | 1.000 | 1.000 | 1.000 |
| 08-workspace-transplant-bundle-repair | opencode/gpt-5.4-mini | 1.000 | 1.000 | 1.000 | 1.000 |
| 11-mcp-openbao-contract-repair | opencode/gpt-5.4-mini | 1.000 | 1.000 | 1.000 | 1.000 |
| 13-wildcard-tls-route-coverage | opencode/gpt-5.4-mini | 1.000 | 1.000 | 1.000 | 1.000 |
| 14-build-workspace-plane-convergence | opencode/gpt-5.4-mini | 1.000 | 1.000 | 1.000 | 1.000 |

# Pricing Provenance

| Model | Benchmark Price $/1M | Reference Price $/1M | Price Source | Price Type | Price Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| opencode/gpt-5.4-mini | 1.6875 | n/a | openrouter | automatic-openrouter-primary | medium | Primary blended price derived automatically from OpenRouter listing openai/gpt-5.4-mini using a 3:1 input:output blend. |

## Capability Coverage

- Fully comparable models for the current task set: opencode/gpt-5.4-mini
- Models with limited comparability: none
- Task set capability requirements: unattendedBenchmarkRuns


## Capability Matrix

| Capability | Required By Tasks | Supported Models | Limited Models | Unsupported Models | Unknown Models |
| --- | --- | --- | --- | --- | --- |
| unattendedBenchmarkRuns | 01-iac-kubernetes-rollout, 02-terraform-static-site, 03-ansible-nginx-role, 04-docker-compose-observability, 05-log-audit-script, 06-kubernetes-oidc-rbac-repair, 07-cnpg-restore-manifest-repair, 08-workspace-transplant-bundle-repair, 09-gitops-workspace-render-validation, 10-bootstrap-phase-validation-repair, 11-mcp-openbao-contract-repair, 12-pre-argocd-bootstrap-sequencing, 13-wildcard-tls-route-coverage, 14-build-workspace-plane-convergence | opencode/gpt-5.4-mini | - | - | - |
