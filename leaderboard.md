# Model Summary

| Rank | Model | Score | Value Score | Composite Score | Success Rate | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | opencode/glm-5 | 0.07 | 0.067 | 0.067 | 7% | 25 | 20.00 | 106.6 | 0.0045 | yes | yes |  |
| 2 | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 8 | n/a | 106.7 | 0.0000 | no | yes |  |

# Limited Comparability

| Rank | Model | Score | Value Score | Composite Score | Success Rate | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 3 | n/a | 106.8 | 0.0000 | no | no | unattendedBenchmarkRuns: limited |
| 2 | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 8 | n/a | 106.7 | 0.0000 | no | no | unattendedBenchmarkRuns: limited |
| 3 | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 8 | n/a | 106.7 | 0.0000 | no | no | unattendedBenchmarkRuns: unsupported |

# Task Detail

| Task | Model | Score | Value Score | Composite Score | Success Rate | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 20 | 20.00 | 83.3 | 0.0045 | 21.00 | yes |  |
| 01-iac-kubernetes-rollout | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 8 | 8.00 | 106.7 | 0.0000 | 9.00 | yes |  |
| 02-terraform-static-site | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 02-terraform-static-site | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 5 | 5.00 | 23.3 | 0.0000 | 5.00 | yes |  |
| 03-ansible-nginx-role | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 03-ansible-nginx-role | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 04-docker-compose-observability | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 04-docker-compose-observability | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 05-log-audit-script | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 05-log-audit-script | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 06-kubernetes-oidc-rbac-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 06-kubernetes-oidc-rbac-repair | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 07-cnpg-restore-manifest-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 07-cnpg-restore-manifest-repair | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 08-workspace-transplant-bundle-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 08-workspace-transplant-bundle-repair | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 09-gitops-workspace-render-validation | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 09-gitops-workspace-render-validation | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 10-bootstrap-phase-validation-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 10-bootstrap-phase-validation-repair | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 11-mcp-openbao-contract-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 11-mcp-openbao-contract-repair | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 12-pre-argocd-bootstrap-sequencing | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 12-pre-argocd-bootstrap-sequencing | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 13-wildcard-tls-route-coverage | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 13-wildcard-tls-route-coverage | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 14-build-workspace-plane-convergence | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 14-build-workspace-plane-convergence | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 15-workspace-runtime-access-convergence | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |
| 15-workspace-runtime-access-convergence | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | yes |  |

# Task Detail: Limited Comparability

| Task | Model | Score | Value Score | Composite Score | Success Rate | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 3 | 3.00 | 106.8 | 0.0000 | 4.00 | no | unattendedBenchmarkRuns: limited |
| 01-iac-kubernetes-rollout | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 8 | 8.00 | 106.7 | 0.0000 | 9.00 | no | unattendedBenchmarkRuns: unsupported |
| 01-iac-kubernetes-rollout | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 8 | 8.00 | 106.7 | 0.0000 | 9.00 | no | unattendedBenchmarkRuns: limited |
| 02-terraform-static-site | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 02-terraform-static-site | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 02-terraform-static-site | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 03-ansible-nginx-role | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 03-ansible-nginx-role | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 03-ansible-nginx-role | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 04-docker-compose-observability | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 04-docker-compose-observability | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 04-docker-compose-observability | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 05-log-audit-script | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 05-log-audit-script | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 05-log-audit-script | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 06-kubernetes-oidc-rbac-repair | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 06-kubernetes-oidc-rbac-repair | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 06-kubernetes-oidc-rbac-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 07-cnpg-restore-manifest-repair | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 07-cnpg-restore-manifest-repair | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 07-cnpg-restore-manifest-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 08-workspace-transplant-bundle-repair | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 08-workspace-transplant-bundle-repair | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 08-workspace-transplant-bundle-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 09-gitops-workspace-render-validation | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 09-gitops-workspace-render-validation | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 09-gitops-workspace-render-validation | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 10-bootstrap-phase-validation-repair | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 10-bootstrap-phase-validation-repair | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 10-bootstrap-phase-validation-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 11-mcp-openbao-contract-repair | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 11-mcp-openbao-contract-repair | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 11-mcp-openbao-contract-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 12-pre-argocd-bootstrap-sequencing | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 12-pre-argocd-bootstrap-sequencing | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 12-pre-argocd-bootstrap-sequencing | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 13-wildcard-tls-route-coverage | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 13-wildcard-tls-route-coverage | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 13-wildcard-tls-route-coverage | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 14-build-workspace-plane-convergence | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 14-build-workspace-plane-convergence | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 14-build-workspace-plane-convergence | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 15-workspace-runtime-access-convergence | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |
| 15-workspace-runtime-access-convergence | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: unsupported |
| 15-workspace-runtime-access-convergence | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 0.00 | 0.0 | 0.0000 | 0.00 | no | unattendedBenchmarkRuns: limited |

# Scoring

- `Score` is binary correctness.
- `Value Score` is the secondary efficiency metric based on ORPT, actual observed cost, and wall time.
- `Composite Score = 0.70 * Score + 0.30 * Value Score`.
- Comparable model rankings are sorted by `Composite Score`, with ORPT as a tie-breaker.

# Value Score Components

| Task | Model | Value Score | ORPT Factor | Cost Factor | Time Factor |
| --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |

# Pricing Provenance

| Model | Benchmark Price $/1M | Reference Price $/1M | Price Source | Price Type | Price Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| opencode/glm-5 | 1.6 | 1.115 | artificial-analysis | manual-primary-with-openrouter-reference | high | OpenRouter reference blend for z-ai/glm-5 is 1.115 USD per 1M tokens using a 3:1 input:output mix. |
| opencode/gemini-3.1-pro | 4.5 | n/a | artificial-analysis | manual-primary-with-openrouter-reference | high | OpenRouter reference blend for google/gemini-3.1-pro-preview is 4.5 USD per 1M tokens using a 3:1 input:output mix. |
| opencode/gemini-3-flash | 1.1 | n/a | artificial-analysis | manual-primary-with-openrouter-reference | high | OpenRouter reference blend for google/gemini-3-flash-preview is 1.125 USD per 1M tokens using a 3:1 input:output mix. |
| opencode/nemotron-3-super-free | 0 | 0.2 | artificial-analysis | manual-primary-with-openrouter-reference | high | OpenRouter reference blend for nvidia/nemotron-3-super-120b-a12b:free is 0 USD per 1M tokens using a 3:1 input:output mix. Reference price uses nvidia/nemotron-3-super-120b-a12b at 0.2 USD per 1M tokens from the same OpenRouter family. |
| opencode/minimax-m2.5-free | 0 | 0.336 | openrouter | automatic-openrouter-primary | medium | Primary blended price derived automatically from OpenRouter listing minimax/minimax-m2.5:free using a 3:1 input:output blend. Reference price uses minimax/minimax-m2.5 at 0.336 USD per 1M tokens from the same OpenRouter family. |

## Capability Coverage

- Fully comparable models for the current task set: opencode/glm-5, opencode/gemini-3.1-pro
- Models with limited comparability: opencode/gemini-3-flash, opencode/nemotron-3-super-free, opencode/minimax-m2.5-free
- Task set capability requirements: unattendedBenchmarkRuns

Known exclusions by model:
- opencode/gemini-3-flash: 01-iac-kubernetes-rollout (unattendedBenchmarkRuns: limited); 02-terraform-static-site (unattendedBenchmarkRuns: limited); 03-ansible-nginx-role (unattendedBenchmarkRuns: limited); 04-docker-compose-observability (unattendedBenchmarkRuns: limited); 05-log-audit-script (unattendedBenchmarkRuns: limited); 06-kubernetes-oidc-rbac-repair (unattendedBenchmarkRuns: limited); 07-cnpg-restore-manifest-repair (unattendedBenchmarkRuns: limited); 08-workspace-transplant-bundle-repair (unattendedBenchmarkRuns: limited); 09-gitops-workspace-render-validation (unattendedBenchmarkRuns: limited); 10-bootstrap-phase-validation-repair (unattendedBenchmarkRuns: limited); 11-mcp-openbao-contract-repair (unattendedBenchmarkRuns: limited); 12-pre-argocd-bootstrap-sequencing (unattendedBenchmarkRuns: limited); 13-wildcard-tls-route-coverage (unattendedBenchmarkRuns: limited); 14-build-workspace-plane-convergence (unattendedBenchmarkRuns: limited); 15-workspace-runtime-access-convergence (unattendedBenchmarkRuns: limited)
- opencode/nemotron-3-super-free: 01-iac-kubernetes-rollout (unattendedBenchmarkRuns: limited); 02-terraform-static-site (unattendedBenchmarkRuns: limited); 03-ansible-nginx-role (unattendedBenchmarkRuns: limited); 04-docker-compose-observability (unattendedBenchmarkRuns: limited); 05-log-audit-script (unattendedBenchmarkRuns: limited); 06-kubernetes-oidc-rbac-repair (unattendedBenchmarkRuns: limited); 07-cnpg-restore-manifest-repair (unattendedBenchmarkRuns: limited); 08-workspace-transplant-bundle-repair (unattendedBenchmarkRuns: limited); 09-gitops-workspace-render-validation (unattendedBenchmarkRuns: limited); 10-bootstrap-phase-validation-repair (unattendedBenchmarkRuns: limited); 11-mcp-openbao-contract-repair (unattendedBenchmarkRuns: limited); 12-pre-argocd-bootstrap-sequencing (unattendedBenchmarkRuns: limited); 13-wildcard-tls-route-coverage (unattendedBenchmarkRuns: limited); 14-build-workspace-plane-convergence (unattendedBenchmarkRuns: limited); 15-workspace-runtime-access-convergence (unattendedBenchmarkRuns: limited)
- opencode/minimax-m2.5-free: 01-iac-kubernetes-rollout (unattendedBenchmarkRuns: unsupported); 02-terraform-static-site (unattendedBenchmarkRuns: unsupported); 03-ansible-nginx-role (unattendedBenchmarkRuns: unsupported); 04-docker-compose-observability (unattendedBenchmarkRuns: unsupported); 05-log-audit-script (unattendedBenchmarkRuns: unsupported); 06-kubernetes-oidc-rbac-repair (unattendedBenchmarkRuns: unsupported); 07-cnpg-restore-manifest-repair (unattendedBenchmarkRuns: unsupported); 08-workspace-transplant-bundle-repair (unattendedBenchmarkRuns: unsupported); 09-gitops-workspace-render-validation (unattendedBenchmarkRuns: unsupported); 10-bootstrap-phase-validation-repair (unattendedBenchmarkRuns: unsupported); 11-mcp-openbao-contract-repair (unattendedBenchmarkRuns: unsupported); 12-pre-argocd-bootstrap-sequencing (unattendedBenchmarkRuns: unsupported); 13-wildcard-tls-route-coverage (unattendedBenchmarkRuns: unsupported); 14-build-workspace-plane-convergence (unattendedBenchmarkRuns: unsupported); 15-workspace-runtime-access-convergence (unattendedBenchmarkRuns: unsupported)


## Capability Matrix

| Capability | Required By Tasks | Supported Models | Limited Models | Unsupported Models | Unknown Models |
| --- | --- | --- | --- | --- | --- |
| unattendedBenchmarkRuns | 01-iac-kubernetes-rollout, 02-terraform-static-site, 03-ansible-nginx-role, 04-docker-compose-observability, 05-log-audit-script, 06-kubernetes-oidc-rbac-repair, 07-cnpg-restore-manifest-repair, 08-workspace-transplant-bundle-repair, 09-gitops-workspace-render-validation, 10-bootstrap-phase-validation-repair, 11-mcp-openbao-contract-repair, 12-pre-argocd-bootstrap-sequencing, 13-wildcard-tls-route-coverage, 14-build-workspace-plane-convergence, 15-workspace-runtime-access-convergence | - | opencode/gemini-3-flash, opencode/nemotron-3-super-free | opencode/minimax-m2.5-free | opencode/glm-5, opencode/gemini-3.1-pro |
