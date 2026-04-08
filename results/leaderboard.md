# Model Summary

| Rank | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | opencode/glm-5.1 | 0.94 | 0.941 | 0.941 | 94% | 1 | 236 | 13.75 | 1818.9 | 0.0823 | yes | yes |  |

# Limited Comparability

| Rank | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| - | No runs yet | - | - | - | - | - | - | - | - | - | - | - | - |

# Task Detail

| Task | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 11 | 11.00 | 49.7 | 0.0051 | 12.00 | yes |  |
| 02-terraform-static-site | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 18 | 18.00 | 103.1 | 0.0049 | 19.00 | yes |  |
| 03-ansible-nginx-role | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 12 | 12.00 | 43.9 | 0.0043 | 13.00 | yes |  |
| 04-docker-compose-observability | opencode/glm-5.1 | 0.00 | 0.000 | 0.000 | 0% | 1 | 16 | 16.00 | 300.1 | n/a | 17.00 | yes |  |
| 05-log-audit-script | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 9 | 9.00 | 36.5 | 0.0036 | 9.00 | yes |  |
| 06-kubernetes-oidc-rbac-repair | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 14 | 14.00 | 187.3 | 0.0060 | 15.00 | yes |  |
| 07-cnpg-restore-manifest-repair | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 17 | 17.00 | 68.4 | 0.0052 | 18.00 | yes |  |
| 08-workspace-transplant-bundle-repair | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 8 | 8.00 | 54.4 | 0.0040 | 9.00 | yes |  |
| 09-gitops-workspace-render-validation | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 15 | 15.00 | 91.2 | 0.0058 | 16.00 | yes |  |
| 10-bootstrap-phase-validation-repair | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 15 | 15.00 | 134.2 | 0.0065 | 16.00 | yes |  |
| 11-mcp-openbao-contract-repair | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 12 | 12.00 | 112.4 | 0.0048 | 13.00 | yes |  |
| 12-pre-argocd-bootstrap-sequencing | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 19 | 19.00 | 206.6 | 0.0063 | 20.00 | yes |  |
| 13-wildcard-tls-route-coverage | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 15 | 15.00 | 106.3 | 0.0055 | 16.00 | yes |  |
| 14-build-workspace-plane-convergence | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 15 | 15.00 | 107.9 | 0.0063 | 16.00 | yes |  |
| 15-workspace-runtime-access-convergence | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 22 | 22.00 | 125.5 | 0.0068 | 23.00 | yes |  |
| 16-event-status-shell | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 10 | 10.00 | 39.5 | 0.0037 | 11.00 | yes |  |
| 17-log-level-rollup | opencode/glm-5.1 | 1.00 | 1.000 | 1.000 | 100% | 0 | 8 | 8.00 | 51.8 | 0.0035 | 9.00 | yes |  |

# Task Detail: Limited Comparability

| Task | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| No runs yet | - | - | - | - | - | - | - | - | - | - | - | - | - |

# Scoring

- `Score` is binary correctness.
- `Value Score` is the secondary efficiency metric based on ORPT, actual observed cost, and wall time.
- `Composite Score = 0.70 * Score + 0.30 * Value Score`.
- Comparable model rankings are sorted by `Composite Score`, with ORPT as a tie-breaker.

# Value Score Components

| Task | Model | Value Score | ORPT Factor | Cost Factor | Time Factor |
| --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 02-terraform-static-site | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 03-ansible-nginx-role | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 05-log-audit-script | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 06-kubernetes-oidc-rbac-repair | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 07-cnpg-restore-manifest-repair | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 08-workspace-transplant-bundle-repair | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 09-gitops-workspace-render-validation | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 10-bootstrap-phase-validation-repair | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 11-mcp-openbao-contract-repair | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 12-pre-argocd-bootstrap-sequencing | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 13-wildcard-tls-route-coverage | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 14-build-workspace-plane-convergence | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 15-workspace-runtime-access-convergence | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 16-event-status-shell | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |
| 17-log-level-rollup | opencode/glm-5.1 | 1.000 | 1.000 | 1.000 | 1.000 |

# Pricing Provenance

| Model | Benchmark Price $/1M | Reference Price $/1M | Price Source | Price Type | Price Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| opencode/glm-5.1 | 1.935 | n/a | openrouter | automatic-openrouter-primary | medium | Primary blended price derived automatically from OpenRouter listing z-ai/glm-5.1 using a 3:1 input:output blend. |

## Capability Coverage

- Fully comparable models for the current task set: opencode/glm-5.1
- Models with limited comparability: none
- Task set capability requirements: unattendedBenchmarkRuns


## Capability Matrix

| Capability | Required By Tasks | Supported Models | Limited Models | Unsupported Models | Unknown Models |
| --- | --- | --- | --- | --- | --- |
| unattendedBenchmarkRuns | 01-iac-kubernetes-rollout, 02-terraform-static-site, 03-ansible-nginx-role, 04-docker-compose-observability, 05-log-audit-script, 06-kubernetes-oidc-rbac-repair, 07-cnpg-restore-manifest-repair, 08-workspace-transplant-bundle-repair, 09-gitops-workspace-render-validation, 10-bootstrap-phase-validation-repair, 11-mcp-openbao-contract-repair, 12-pre-argocd-bootstrap-sequencing, 13-wildcard-tls-route-coverage, 14-build-workspace-plane-convergence, 15-workspace-runtime-access-convergence, 16-event-status-shell, 17-log-level-rollup | - | - | - | opencode/glm-5.1 |
