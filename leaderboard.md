# Model Summary

| Rank | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | opencode/big-pickle | 0.82 | 0.824 | 0.824 | 82% | 2 | 340 | 15.07 | 1302.0 | 0.0000 | yes | yes |  |

# Limited Comparability

| Rank | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| - | No runs yet | - | - | - | - | - | - | - | - | - | - | - | - |

# Task Detail

| Task | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/big-pickle | 0.00 | 0.000 | 0.000 | 0% | 0 | 6 | 6.00 | 31.1 | 0.0000 | 7.00 | yes |  |
| 02-terraform-static-site | opencode/big-pickle | 0.00 | 0.000 | 0.000 | 0% | 1 | 61 | 61.00 | 300.1 | n/a | 62.00 | yes |  |
| 03-ansible-nginx-role | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 12 | 12.00 | 38.0 | 0.0000 | 12.00 | yes |  |
| 04-docker-compose-observability | opencode/big-pickle | 0.00 | 0.000 | 0.000 | 0% | 1 | 62 | 62.00 | 300.1 | n/a | 62.00 | yes |  |
| 05-log-audit-script | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 9 | 9.00 | 21.0 | 0.0000 | 10.00 | yes |  |
| 06-kubernetes-oidc-rbac-repair | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 20 | 20.00 | 82.6 | 0.0000 | 21.00 | yes |  |
| 07-cnpg-restore-manifest-repair | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 8 | 8.00 | 16.5 | 0.0000 | 9.00 | yes |  |
| 08-workspace-transplant-bundle-repair | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 15 | 15.00 | 36.2 | 0.0000 | 16.00 | yes |  |
| 09-gitops-workspace-render-validation | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 16 | 16.00 | 48.9 | 0.0000 | 17.00 | yes |  |
| 10-bootstrap-phase-validation-repair | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 27 | 27.00 | 96.6 | 0.0000 | 28.00 | yes |  |
| 11-mcp-openbao-contract-repair | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 13 | 13.00 | 41.2 | 0.0000 | 14.00 | yes |  |
| 12-pre-argocd-bootstrap-sequencing | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 22 | 22.00 | 63.9 | 0.0000 | 23.00 | yes |  |
| 13-wildcard-tls-route-coverage | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 9 | 9.00 | 42.9 | 0.0000 | 10.00 | yes |  |
| 14-build-workspace-plane-convergence | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 18 | 18.00 | 54.0 | 0.0000 | 19.00 | yes |  |
| 15-workspace-runtime-access-convergence | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 27 | 27.00 | 78.6 | 0.0000 | 28.00 | yes |  |
| 16-event-status-shell | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 7 | 7.00 | 20.6 | 0.0000 | 8.00 | yes |  |
| 17-log-level-rollup | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 8 | 8.00 | 29.7 | 0.0000 | 9.00 | yes |  |

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
| 03-ansible-nginx-role | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 05-log-audit-script | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 06-kubernetes-oidc-rbac-repair | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 07-cnpg-restore-manifest-repair | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 08-workspace-transplant-bundle-repair | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 09-gitops-workspace-render-validation | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 10-bootstrap-phase-validation-repair | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 11-mcp-openbao-contract-repair | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 12-pre-argocd-bootstrap-sequencing | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 13-wildcard-tls-route-coverage | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 14-build-workspace-plane-convergence | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 15-workspace-runtime-access-convergence | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 16-event-status-shell | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 17-log-level-rollup | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |

# Pricing Provenance

| Model | Benchmark Price $/1M | Reference Price $/1M | Price Source | Price Type | Price Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| opencode/big-pickle | n/a | n/a | manual | n/a | n/a | No trustworthy automatic pricing reference found yet, so cost is currently unknown. |

## Capability Coverage

- Fully comparable models for the current task set: opencode/big-pickle
- Models with limited comparability: none
- Task set capability requirements: unattendedBenchmarkRuns


## Capability Matrix

| Capability | Required By Tasks | Supported Models | Limited Models | Unsupported Models | Unknown Models |
| --- | --- | --- | --- | --- | --- |
| unattendedBenchmarkRuns | 01-iac-kubernetes-rollout, 02-terraform-static-site, 03-ansible-nginx-role, 04-docker-compose-observability, 05-log-audit-script, 06-kubernetes-oidc-rbac-repair, 07-cnpg-restore-manifest-repair, 08-workspace-transplant-bundle-repair, 09-gitops-workspace-render-validation, 10-bootstrap-phase-validation-repair, 11-mcp-openbao-contract-repair, 12-pre-argocd-bootstrap-sequencing, 13-wildcard-tls-route-coverage, 14-build-workspace-plane-convergence, 15-workspace-runtime-access-convergence, 16-event-status-shell, 17-log-level-rollup | - | - | - | opencode/big-pickle |
