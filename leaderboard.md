# Model Summary

| Rank | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | opencode/glm-5 | 0.81 | 0.785 | 0.806 | 81% | 1 | 306 | 11.41 | 1289.7 | 6.2197 | yes | yes |  |
| 2 | opencode/gemini-3.1-pro | 0.37 | 0.280 | 0.343 | 37% | 3 | 307 | 12.70 | 3084.9 | 5.8536 | yes | yes |  |

# Limited Comparability

| Rank | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | opencode/minimax-m2.5-free | 0.59 | 0.000 | 0.415 | 59% | 4 | 475 | 16.19 | 2493.6 | 0.0000 | yes | no | unattendedBenchmarkRuns: unsupported |
| 2 | opencode/gemini-3-flash | 0.59 | 0.000 | 0.415 | 59% | 4 | 508 | 21.81 | 3771.6 | 2.4307 | yes | no | unattendedBenchmarkRuns: limited |
| 3 | opencode/nemotron-3-super-free | 0.26 | 0.000 | 0.181 | 26% | 12 | 502 | 19.43 | 6540.3 | 0.0000 | yes | no | unattendedBenchmarkRuns: limited |

# Task Detail

| Task | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 11 | 11.00 | 90.1 | 0.2197 | 12.00 | yes |  |
| 01-iac-kubernetes-rollout | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 11 | 11.00 | 95.1 | 0.1657 | 12.00 | yes |  |
| 02-terraform-static-site | opencode/gemini-3.1-pro | 1.00 | 1.000 | 1.000 | 100% | 0 | 5 | 5.00 | 80.1 | 0.0872 | 6.00 | yes |  |
| 02-terraform-static-site | opencode/glm-5 | 1.00 | 0.460 | 0.838 | 100% | 0 | 12 | 12.00 | 113.3 | 0.2140 | 13.00 | yes |  |
| 03-ansible-nginx-role | opencode/gemini-3.1-pro | 1.00 | 0.464 | 0.839 | 100% | 0 | 10 | 10.00 | 94.4 | 0.1680 | 11.00 | yes |  |
| 03-ansible-nginx-role | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 6 | 6.00 | 24.8 | 0.0776 | 7.00 | yes |  |
| 04-docker-compose-observability | opencode/gemini-3.1-pro | 1.00 | 1.000 | 1.000 | 100% | 0 | 19 | 19.00 | 236.7 | 0.3295 | 20.00 | yes |  |
| 04-docker-compose-observability | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 7 | 7.00 | 24.0 | 0.0956 | 8.00 | yes |  |
| 05-log-audit-script | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 6 | 6.00 | 18.1 | 0.0266 | 7.00 | yes |  |
| 05-log-audit-script | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 1 | 8 | 8.00 | 75.1 | 0.0000 | 9.00 | yes |  |
| 06-kubernetes-oidc-rbac-repair | opencode/gemini-3.1-pro | 1.00 | 1.000 | 1.000 | 100% | 0 | 14 | 14.00 | 88.8 | 0.2299 | 14.00 | yes |  |
| 06-kubernetes-oidc-rbac-repair | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 6 | 6.00 | 24.3 | 0.0277 | 7.00 | yes |  |
| 07-cnpg-restore-manifest-repair | opencode/gemini-3.1-pro | 1.00 | 0.698 | 0.909 | 100% | 0 | 12 | 12.00 | 93.0 | 0.2791 | 13.00 | yes |  |
| 07-cnpg-restore-manifest-repair | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 10 | 10.00 | 39.1 | 0.2067 | 11.00 | yes |  |
| 08-workspace-transplant-bundle-repair | opencode/gemini-3.1-pro | 1.00 | 0.872 | 0.962 | 100% | 0 | 9 | 9.00 | 59.9 | 0.1576 | 10.00 | yes |  |
| 08-workspace-transplant-bundle-repair | opencode/glm-5 | 1.00 | 0.930 | 0.979 | 100% | 0 | 9 | 9.00 | 30.2 | 0.1940 | 10.00 | yes |  |
| 09-gitops-workspace-render-validation | opencode/gemini-3.1-pro | 1.00 | 0.892 | 0.968 | 100% | 0 | 9 | 9.00 | 80.8 | 0.1641 | 10.00 | yes |  |
| 09-gitops-workspace-render-validation | opencode/glm-5 | 1.00 | 0.795 | 0.938 | 100% | 0 | 11 | 11.00 | 45.6 | 0.2443 | 12.00 | yes |  |
| 10-bootstrap-phase-validation-repair | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 16 | 16.00 | 53.1 | 0.3605 | 17.00 | yes |  |
| 10-bootstrap-phase-validation-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 16 | 16.00 | 139.0 | 0.3025 | 17.00 | yes |  |
| 11-mcp-openbao-contract-repair | opencode/gemini-3.1-pro | 1.00 | 0.457 | 0.837 | 100% | 0 | 16 | 16.00 | 293.8 | 0.4583 | 17.00 | yes |  |
| 11-mcp-openbao-contract-repair | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 11 | 11.00 | 40.7 | 0.2454 | 12.00 | yes |  |
| 12-pre-argocd-bootstrap-sequencing | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 13 | 13.00 | 42.4 | 0.3122 | 14.00 | yes |  |
| 12-pre-argocd-bootstrap-sequencing | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 17 | 17.00 | 162.6 | 0.3456 | 18.00 | yes |  |
| 13-wildcard-tls-route-coverage | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 8 | 8.00 | 23.9 | 0.1360 | 9.00 | yes |  |
| 13-wildcard-tls-route-coverage | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 12 | 12.00 | 101.6 | 0.1606 | 13.00 | yes |  |
| 14-build-workspace-plane-convergence | opencode/gemini-3.1-pro | 1.00 | 0.457 | 0.837 | 100% | 0 | 25 | 25.00 | 235.3 | 0.6600 | 26.00 | yes |  |
| 14-build-workspace-plane-convergence | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 14 | 14.00 | 51.6 | 0.3541 | 15.00 | yes |  |
| 15-workspace-runtime-access-convergence | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 15 | 15.00 | 45.1 | 0.3750 | 16.00 | yes |  |
| 15-workspace-runtime-access-convergence | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 23 | 23.00 | 191.7 | 0.5298 | 24.00 | yes |  |
| 16-event-status-shell | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 8 | 8.00 | 17.9 | 0.1528 | 9.00 | yes |  |
| 16-event-status-shell | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 1 | 7 | 7.00 | 45.1 | 0.0000 | 8.00 | yes |  |
| 17-log-level-rollup | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 10 | 10.00 | 17.8 | 0.1995 | 11.00 | yes |  |
| 17-log-level-rollup | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 1 | 8 | 8.00 | 60.1 | 0.0000 | 8.00 | yes |  |
| 18-rhel-edge-firewalld-router-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 9 | 9.00 | 69.1 | 0.1203 | 9.00 | yes |  |
| 18-rhel-edge-firewalld-router-repair | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 1 | 18 | 18.00 | 240.1 | 0.0000 | 19.00 | yes |  |
| 19-selinux-registry-volume-label-repair | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 8 | 8.00 | 21.0 | 0.1495 | 9.00 | yes |  |
| 19-selinux-registry-volume-label-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 3 | 3.00 | 19.3 | 0.0385 | 4.00 | yes |  |
| 20-apparmor-dnsmasq-profile-repair | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 16 | 16.00 | 34.8 | 0.4328 | 17.00 | yes |  |
| 20-apparmor-dnsmasq-profile-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 13 | 13.00 | 127.8 | 0.2495 | 14.00 | yes |  |
| 21-rhel-k3s-node-prep-repair | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 16 | 16.00 | 53.6 | 0.4351 | 16.00 | yes |  |
| 21-rhel-k3s-node-prep-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 10 | 10.00 | 104.0 | 0.1624 | 11.00 | yes |  |
| 22-nftables-router-ingress-repair | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 18 | 18.00 | 51.4 | 0.5300 | 19.00 | yes |  |
| 22-nftables-router-ingress-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 9 | 9.00 | 109.7 | 0.2268 | 10.00 | yes |  |
| 23-rhel-networkmanager-bridge-vlan-repair | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 10 | 10.00 | 31.4 | 0.2073 | 11.00 | yes |  |
| 23-rhel-networkmanager-bridge-vlan-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 9 | 9.00 | 92.6 | 0.1941 | 10.00 | yes |  |
| 24-k3s-registry-mirror-trust-repair | opencode/gemini-3.1-pro | 1.00 | 0.722 | 0.917 | 100% | 0 | 8 | 8.00 | 51.7 | 0.1489 | 9.00 | yes |  |
| 24-k3s-registry-mirror-trust-repair | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 7 | 7.00 | 17.1 | 0.1310 | 8.00 | yes |  |
| 25-metallb-ingress-address-pool-repair | opencode/glm-5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 16 | 16.00 | 48.1 | 0.3953 | 17.00 | yes |  |
| 25-metallb-ingress-address-pool-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 3 | 3.00 | 33.7 | 0.0619 | 4.00 | yes |  |
| 26-traefik-forwarded-header-trust-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 15 | 15.00 | 281.8 | 0.4734 | 16.00 | yes |  |
| 26-traefik-forwarded-header-trust-repair | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 17 | 17.00 | 60.4 | 0.3783 | 18.00 | yes |  |
| 27-external-dns-rfc2136-repair | opencode/gemini-3.1-pro | 0.00 | 0.000 | 0.000 | 0% | 0 | 7 | 7.00 | 62.0 | 0.1398 | 8.00 | yes |  |
| 27-external-dns-rfc2136-repair | opencode/glm-5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 7 | 7.00 | 29.6 | 0.1184 | 8.00 | yes |  |

# Task Detail: Limited Comparability

| Task | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 17 | 17.00 | 94.9 | 0.0000 | 18.00 | no | unattendedBenchmarkRuns: unsupported |
| 01-iac-kubernetes-rollout | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 9 | 9.00 | 82.2 | 0.0523 | 10.00 | no | unattendedBenchmarkRuns: limited |
| 01-iac-kubernetes-rollout | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 24 | 24.00 | 300.1 | 0.0000 | 25.00 | no | unattendedBenchmarkRuns: limited |
| 02-terraform-static-site | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 9 | 9.00 | 97.6 | 0.0568 | 10.00 | no | unattendedBenchmarkRuns: limited |
| 02-terraform-static-site | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 17 | 17.00 | 80.1 | 0.0000 | 18.00 | no | unattendedBenchmarkRuns: unsupported |
| 02-terraform-static-site | opencode/nemotron-3-super-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 14 | 14.00 | 238.2 | 0.0000 | 14.00 | no | unattendedBenchmarkRuns: limited |
| 03-ansible-nginx-role | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 9 | 9.00 | 70.7 | 0.0000 | 10.00 | no | unattendedBenchmarkRuns: unsupported |
| 03-ansible-nginx-role | opencode/nemotron-3-super-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 25 | 25.00 | 281.1 | 0.0000 | 26.00 | no | unattendedBenchmarkRuns: limited |
| 03-ansible-nginx-role | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 1 | 11 | 11.00 | 300.1 | 0.0000 | 12.00 | no | unattendedBenchmarkRuns: limited |
| 04-docker-compose-observability | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 13 | 13.00 | 146.5 | 0.0786 | 13.00 | no | unattendedBenchmarkRuns: limited |
| 04-docker-compose-observability | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 31 | 31.00 | 300.1 | 0.0000 | 32.00 | no | unattendedBenchmarkRuns: unsupported |
| 04-docker-compose-observability | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 17 | 17.00 | 206.3 | 0.0000 | 18.00 | no | unattendedBenchmarkRuns: limited |
| 05-log-audit-script | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 1 | 10 | 10.00 | 75.1 | 0.0000 | 11.00 | no | unattendedBenchmarkRuns: limited |
| 05-log-audit-script | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 12 | 12.00 | 75.1 | 0.0000 | 12.00 | no | unattendedBenchmarkRuns: unsupported |
| 05-log-audit-script | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 8 | 8.00 | 75.1 | 0.0000 | 9.00 | no | unattendedBenchmarkRuns: limited |
| 06-kubernetes-oidc-rbac-repair | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 25 | 25.00 | 161.7 | 0.1416 | 25.00 | no | unattendedBenchmarkRuns: limited |
| 06-kubernetes-oidc-rbac-repair | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 22 | 22.00 | 132.8 | 0.0000 | 22.00 | no | unattendedBenchmarkRuns: unsupported |
| 06-kubernetes-oidc-rbac-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 27 | 27.00 | 300.1 | 0.0000 | 27.00 | no | unattendedBenchmarkRuns: limited |
| 07-cnpg-restore-manifest-repair | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 14 | 14.00 | 69.0 | 0.0716 | 15.00 | no | unattendedBenchmarkRuns: limited |
| 07-cnpg-restore-manifest-repair | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 15 | 15.00 | 86.6 | 0.0000 | 16.00 | no | unattendedBenchmarkRuns: unsupported |
| 07-cnpg-restore-manifest-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 21 | 21.00 | 300.1 | 0.0000 | 21.00 | no | unattendedBenchmarkRuns: limited |
| 08-workspace-transplant-bundle-repair | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 35 | 35.00 | 250.5 | 0.1858 | 36.00 | no | unattendedBenchmarkRuns: limited |
| 08-workspace-transplant-bundle-repair | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 10 | 10.00 | 51.4 | 0.0000 | 11.00 | no | unattendedBenchmarkRuns: unsupported |
| 08-workspace-transplant-bundle-repair | opencode/nemotron-3-super-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 14 | 14.00 | 160.3 | 0.0000 | 14.00 | no | unattendedBenchmarkRuns: limited |
| 09-gitops-workspace-render-validation | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 17 | 17.00 | 87.6 | 0.0882 | 18.00 | no | unattendedBenchmarkRuns: limited |
| 09-gitops-workspace-render-validation | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 15 | 15.00 | 82.0 | 0.0000 | 16.00 | no | unattendedBenchmarkRuns: unsupported |
| 09-gitops-workspace-render-validation | opencode/nemotron-3-super-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 28 | 28.00 | 244.7 | 0.0000 | 29.00 | no | unattendedBenchmarkRuns: limited |
| 10-bootstrap-phase-validation-repair | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 17 | 17.00 | 197.8 | 0.0782 | 17.00 | no | unattendedBenchmarkRuns: limited |
| 10-bootstrap-phase-validation-repair | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 13 | 13.00 | 60.0 | 0.0000 | 14.00 | no | unattendedBenchmarkRuns: unsupported |
| 10-bootstrap-phase-validation-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 25 | 25.00 | 300.1 | 0.0000 | 26.00 | no | unattendedBenchmarkRuns: limited |
| 11-mcp-openbao-contract-repair | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 26 | 26.00 | 140.2 | 0.1430 | 27.00 | no | unattendedBenchmarkRuns: limited |
| 11-mcp-openbao-contract-repair | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 22 | 22.00 | 110.4 | 0.0000 | 23.00 | no | unattendedBenchmarkRuns: unsupported |
| 11-mcp-openbao-contract-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 26 | 26.00 | 300.1 | 0.0000 | 26.00 | no | unattendedBenchmarkRuns: limited |
| 12-pre-argocd-bootstrap-sequencing | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 18 | 18.00 | 92.1 | 0.0000 | 19.00 | no | unattendedBenchmarkRuns: unsupported |
| 12-pre-argocd-bootstrap-sequencing | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 19 | 19.00 | 123.0 | 0.1001 | 20.00 | no | unattendedBenchmarkRuns: limited |
| 12-pre-argocd-bootstrap-sequencing | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 17 | 17.00 | 300.1 | 0.0000 | 17.00 | no | unattendedBenchmarkRuns: limited |
| 13-wildcard-tls-route-coverage | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 29 | 29.00 | 246.0 | 0.1207 | 30.00 | no | unattendedBenchmarkRuns: limited |
| 13-wildcard-tls-route-coverage | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 75 | 75.00 | 300.1 | 0.0000 | 76.00 | no | unattendedBenchmarkRuns: unsupported |
| 13-wildcard-tls-route-coverage | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 29 | 29.00 | 300.2 | 0.0000 | 29.00 | no | unattendedBenchmarkRuns: limited |
| 14-build-workspace-plane-convergence | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 19 | 19.00 | 73.7 | 0.0000 | 19.00 | no | unattendedBenchmarkRuns: unsupported |
| 14-build-workspace-plane-convergence | opencode/nemotron-3-super-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 20 | 20.00 | 203.4 | 0.0000 | 20.00 | no | unattendedBenchmarkRuns: limited |
| 14-build-workspace-plane-convergence | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 40 | 40.00 | 300.7 | 0.0000 | 41.00 | no | unattendedBenchmarkRuns: limited |
| 15-workspace-runtime-access-convergence | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 27 | 27.00 | 161.3 | 0.1889 | 27.00 | no | unattendedBenchmarkRuns: limited |
| 15-workspace-runtime-access-convergence | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 28 | 28.00 | 80.2 | 0.0000 | 29.00 | no | unattendedBenchmarkRuns: unsupported |
| 15-workspace-runtime-access-convergence | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 18 | 18.00 | 300.0 | 0.0000 | 18.00 | no | unattendedBenchmarkRuns: limited |
| 16-event-status-shell | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 1 | 9 | 9.00 | 45.1 | 0.0000 | 10.00 | no | unattendedBenchmarkRuns: limited |
| 16-event-status-shell | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 7 | 7.00 | 45.1 | 0.0000 | 8.00 | no | unattendedBenchmarkRuns: unsupported |
| 16-event-status-shell | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 4 | 4.00 | 45.1 | 0.0000 | 5.00 | no | unattendedBenchmarkRuns: limited |
| 17-log-level-rollup | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 12 | 12.00 | 48.7 | 0.0000 | 12.00 | no | unattendedBenchmarkRuns: unsupported |
| 17-log-level-rollup | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 1 | 14 | 14.00 | 60.1 | 0.0000 | 14.00 | no | unattendedBenchmarkRuns: limited |
| 17-log-level-rollup | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 7 | 7.00 | 60.1 | 0.0000 | 7.00 | no | unattendedBenchmarkRuns: limited |
| 18-rhel-edge-firewalld-router-repair | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 10 | 10.00 | 79.0 | 0.1025 | 11.00 | no | unattendedBenchmarkRuns: limited |
| 18-rhel-edge-firewalld-router-repair | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 6 | 6.00 | 37.0 | 0.0000 | 7.00 | no | unattendedBenchmarkRuns: unsupported |
| 18-rhel-edge-firewalld-router-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 19 | 19.00 | 240.1 | 0.0000 | 19.00 | no | unattendedBenchmarkRuns: limited |
| 19-selinux-registry-volume-label-repair | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 15 | 15.00 | 74.7 | 0.0799 | 16.00 | no | unattendedBenchmarkRuns: limited |
| 19-selinux-registry-volume-label-repair | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 9 | 9.00 | 73.1 | 0.0000 | 10.00 | no | unattendedBenchmarkRuns: unsupported |
| 19-selinux-registry-volume-label-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 1 | 20 | 20.00 | 300.1 | 0.0000 | 20.00 | no | unattendedBenchmarkRuns: limited |
| 20-apparmor-dnsmasq-profile-repair | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 28 | 28.00 | 208.7 | 0.1621 | 29.00 | no | unattendedBenchmarkRuns: limited |
| 20-apparmor-dnsmasq-profile-repair | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 15 | 15.00 | 81.3 | 0.0000 | 16.00 | no | unattendedBenchmarkRuns: unsupported |
| 20-apparmor-dnsmasq-profile-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 20 | 20.00 | 169.8 | 0.0000 | 20.00 | no | unattendedBenchmarkRuns: limited |
| 21-rhel-k3s-node-prep-repair | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 7 | 7.00 | 48.5 | 0.0468 | 8.00 | no | unattendedBenchmarkRuns: limited |
| 21-rhel-k3s-node-prep-repair | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 13 | 13.00 | 77.4 | 0.0000 | 14.00 | no | unattendedBenchmarkRuns: unsupported |
| 21-rhel-k3s-node-prep-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 22 | 22.00 | 300.7 | 0.0000 | 23.00 | no | unattendedBenchmarkRuns: limited |
| 22-nftables-router-ingress-repair | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 11 | 11.00 | 101.3 | 0.0821 | 12.00 | no | unattendedBenchmarkRuns: limited |
| 22-nftables-router-ingress-repair | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 30 | 30.00 | 103.9 | 0.0000 | 31.00 | no | unattendedBenchmarkRuns: unsupported |
| 22-nftables-router-ingress-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 24 | 24.00 | 292.4 | 0.0000 | 24.00 | no | unattendedBenchmarkRuns: limited |
| 23-rhel-networkmanager-bridge-vlan-repair | opencode/nemotron-3-super-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 22 | 22.00 | 299.2 | 0.0000 | 23.00 | no | unattendedBenchmarkRuns: limited |
| 23-rhel-networkmanager-bridge-vlan-repair | opencode/gemini-3-flash | 0.00 | 0.000 | 0.000 | 0% | 0 | 16 | 16.00 | 154.8 | 0.1243 | 17.00 | no | unattendedBenchmarkRuns: limited |
| 23-rhel-networkmanager-bridge-vlan-repair | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 7 | 7.00 | 52.8 | 0.0000 | 8.00 | no | unattendedBenchmarkRuns: unsupported |
| 24-k3s-registry-mirror-trust-repair | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 40 | 40.00 | 220.3 | 0.2351 | 41.00 | no | unattendedBenchmarkRuns: limited |
| 24-k3s-registry-mirror-trust-repair | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 6 | 6.00 | 44.7 | 0.0000 | 7.00 | no | unattendedBenchmarkRuns: unsupported |
| 24-k3s-registry-mirror-trust-repair | opencode/nemotron-3-super-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 13 | 13.00 | 120.9 | 0.0000 | 14.00 | no | unattendedBenchmarkRuns: limited |
| 25-metallb-ingress-address-pool-repair | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 23 | 23.00 | 133.6 | 0.1348 | 24.00 | no | unattendedBenchmarkRuns: limited |
| 25-metallb-ingress-address-pool-repair | opencode/minimax-m2.5-free | 1.00 | 0.000 | 0.700 | 100% | 0 | 25 | 25.00 | 108.1 | 0.0000 | 26.00 | no | unattendedBenchmarkRuns: unsupported |
| 25-metallb-ingress-address-pool-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 19 | 19.00 | 300.6 | 0.0000 | 20.00 | no | unattendedBenchmarkRuns: limited |
| 26-traefik-forwarded-header-trust-repair | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 15 | 15.00 | 98.1 | 0.0754 | 16.00 | no | unattendedBenchmarkRuns: limited |
| 26-traefik-forwarded-header-trust-repair | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 14 | 14.00 | 70.0 | 0.0000 | 15.00 | no | unattendedBenchmarkRuns: unsupported |
| 26-traefik-forwarded-header-trust-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 18 | 18.00 | 300.5 | 0.0000 | 17.00 | no | unattendedBenchmarkRuns: limited |
| 27-external-dns-rfc2136-repair | opencode/gemini-3-flash | 1.00 | 0.000 | 0.700 | 100% | 0 | 19 | 19.00 | 108.1 | 0.0818 | 20.00 | no | unattendedBenchmarkRuns: limited |
| 27-external-dns-rfc2136-repair | opencode/minimax-m2.5-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 8 | 8.00 | 61.3 | 0.0000 | 9.00 | no | unattendedBenchmarkRuns: unsupported |
| 27-external-dns-rfc2136-repair | opencode/nemotron-3-super-free | 0.00 | 0.000 | 0.000 | 0% | 0 | 1 | 1.00 | 300.7 | 0.0000 | 1.00 | no | unattendedBenchmarkRuns: limited |

# Scoring

- `Score` is binary correctness.
- `Value Score` is the secondary efficiency metric based on ORPT, actual observed cost, and wall time.
- `Composite Score = 0.70 * Score + 0.30 * Value Score`.
- Comparable model rankings are sorted by `Composite Score`, with ORPT as a tie-breaker.

# Value Score Components

| Task | Model | Value Score | ORPT Factor | Cost Factor | Time Factor |
| --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 02-terraform-static-site | opencode/glm-5 | 0.460 | 0.417 | 0.407 | 0.707 |
| 03-ansible-nginx-role | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 05-log-audit-script | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 07-cnpg-restore-manifest-repair | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 08-workspace-transplant-bundle-repair | opencode/glm-5 | 0.930 | 1.000 | 0.812 | 1.000 |
| 09-gitops-workspace-render-validation | opencode/glm-5 | 0.795 | 0.818 | 0.672 | 1.000 |
| 10-bootstrap-phase-validation-repair | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 11-mcp-openbao-contract-repair | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 12-pre-argocd-bootstrap-sequencing | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 13-wildcard-tls-route-coverage | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 14-build-workspace-plane-convergence | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 15-workspace-runtime-access-convergence | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 16-event-status-shell | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 17-log-level-rollup | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 19-selinux-registry-volume-label-repair | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 20-apparmor-dnsmasq-profile-repair | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 21-rhel-k3s-node-prep-repair | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 22-nftables-router-ingress-repair | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 23-rhel-networkmanager-bridge-vlan-repair | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 24-k3s-registry-mirror-trust-repair | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 25-metallb-ingress-address-pool-repair | opencode/glm-5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 02-terraform-static-site | opencode/gemini-3.1-pro | 1.000 | 1.000 | 1.000 | 1.000 |
| 03-ansible-nginx-role | opencode/gemini-3.1-pro | 0.464 | 0.600 | 0.462 | 0.262 |
| 04-docker-compose-observability | opencode/gemini-3.1-pro | 1.000 | 1.000 | 1.000 | 1.000 |
| 06-kubernetes-oidc-rbac-repair | opencode/gemini-3.1-pro | 1.000 | 1.000 | 1.000 | 1.000 |
| 07-cnpg-restore-manifest-repair | opencode/gemini-3.1-pro | 0.698 | 0.833 | 0.741 | 0.421 |
| 08-workspace-transplant-bundle-repair | opencode/gemini-3.1-pro | 0.872 | 1.000 | 1.000 | 0.504 |
| 09-gitops-workspace-render-validation | opencode/gemini-3.1-pro | 0.892 | 1.000 | 1.000 | 0.565 |
| 11-mcp-openbao-contract-repair | opencode/gemini-3.1-pro | 0.457 | 0.688 | 0.536 | 0.139 |
| 14-build-workspace-plane-convergence | opencode/gemini-3.1-pro | 0.457 | 0.560 | 0.536 | 0.219 |
| 24-k3s-registry-mirror-trust-repair | opencode/gemini-3.1-pro | 0.722 | 0.875 | 0.880 | 0.331 |

# Pricing Provenance

| Model | Benchmark Price $/1M | Reference Price $/1M | Price Source | Price Type | Price Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| opencode/glm-5 | 1.6 | 1.115 | artificial-analysis | manual-primary-with-openrouter-reference | high | OpenRouter reference blend for z-ai/glm-5 is 1.115 USD per 1M tokens using a 3:1 input:output mix. |
| opencode/gemini-3.1-pro | 4.5 | n/a | artificial-analysis | manual-primary-with-openrouter-reference | high | OpenRouter reference blend for google/gemini-3.1-pro-preview is 4.5 USD per 1M tokens using a 3:1 input:output mix. |
| opencode/minimax-m2.5-free | 0 | 0.336 | openrouter | automatic-openrouter-primary | medium | Primary blended price derived automatically from OpenRouter listing minimax/minimax-m2.5:free using a 3:1 input:output blend. Reference price uses minimax/minimax-m2.5 at 0.336 USD per 1M tokens from the same OpenRouter family. |
| opencode/gemini-3-flash | 1.1 | n/a | artificial-analysis | manual-primary-with-openrouter-reference | high | OpenRouter reference blend for google/gemini-3-flash-preview is 1.125 USD per 1M tokens using a 3:1 input:output mix. |
| opencode/nemotron-3-super-free | 0 | 0.2 | artificial-analysis | manual-primary-with-openrouter-reference | high | OpenRouter reference blend for nvidia/nemotron-3-super-120b-a12b:free is 0 USD per 1M tokens using a 3:1 input:output mix. Reference price uses nvidia/nemotron-3-super-120b-a12b at 0.2 USD per 1M tokens from the same OpenRouter family. |

## Capability Coverage

- Fully comparable models for the current task set: opencode/glm-5, opencode/gemini-3.1-pro
- Models with limited comparability: opencode/minimax-m2.5-free, opencode/gemini-3-flash, opencode/nemotron-3-super-free
- Task set capability requirements: unattendedBenchmarkRuns

Known exclusions by model:
- opencode/minimax-m2.5-free: 01-iac-kubernetes-rollout (unattendedBenchmarkRuns: unsupported); 02-terraform-static-site (unattendedBenchmarkRuns: unsupported); 03-ansible-nginx-role (unattendedBenchmarkRuns: unsupported); 04-docker-compose-observability (unattendedBenchmarkRuns: unsupported); 05-log-audit-script (unattendedBenchmarkRuns: unsupported); 06-kubernetes-oidc-rbac-repair (unattendedBenchmarkRuns: unsupported); 07-cnpg-restore-manifest-repair (unattendedBenchmarkRuns: unsupported); 08-workspace-transplant-bundle-repair (unattendedBenchmarkRuns: unsupported); 09-gitops-workspace-render-validation (unattendedBenchmarkRuns: unsupported); 10-bootstrap-phase-validation-repair (unattendedBenchmarkRuns: unsupported); 11-mcp-openbao-contract-repair (unattendedBenchmarkRuns: unsupported); 12-pre-argocd-bootstrap-sequencing (unattendedBenchmarkRuns: unsupported); 13-wildcard-tls-route-coverage (unattendedBenchmarkRuns: unsupported); 14-build-workspace-plane-convergence (unattendedBenchmarkRuns: unsupported); 15-workspace-runtime-access-convergence (unattendedBenchmarkRuns: unsupported); 16-event-status-shell (unattendedBenchmarkRuns: unsupported); 17-log-level-rollup (unattendedBenchmarkRuns: unsupported); 18-rhel-edge-firewalld-router-repair (unattendedBenchmarkRuns: unsupported); 19-selinux-registry-volume-label-repair (unattendedBenchmarkRuns: unsupported); 20-apparmor-dnsmasq-profile-repair (unattendedBenchmarkRuns: unsupported); 21-rhel-k3s-node-prep-repair (unattendedBenchmarkRuns: unsupported); 22-nftables-router-ingress-repair (unattendedBenchmarkRuns: unsupported); 23-rhel-networkmanager-bridge-vlan-repair (unattendedBenchmarkRuns: unsupported); 24-k3s-registry-mirror-trust-repair (unattendedBenchmarkRuns: unsupported); 25-metallb-ingress-address-pool-repair (unattendedBenchmarkRuns: unsupported); 26-traefik-forwarded-header-trust-repair (unattendedBenchmarkRuns: unsupported); 27-external-dns-rfc2136-repair (unattendedBenchmarkRuns: unsupported)
- opencode/gemini-3-flash: 01-iac-kubernetes-rollout (unattendedBenchmarkRuns: limited); 02-terraform-static-site (unattendedBenchmarkRuns: limited); 03-ansible-nginx-role (unattendedBenchmarkRuns: limited); 04-docker-compose-observability (unattendedBenchmarkRuns: limited); 05-log-audit-script (unattendedBenchmarkRuns: limited); 06-kubernetes-oidc-rbac-repair (unattendedBenchmarkRuns: limited); 07-cnpg-restore-manifest-repair (unattendedBenchmarkRuns: limited); 08-workspace-transplant-bundle-repair (unattendedBenchmarkRuns: limited); 09-gitops-workspace-render-validation (unattendedBenchmarkRuns: limited); 10-bootstrap-phase-validation-repair (unattendedBenchmarkRuns: limited); 11-mcp-openbao-contract-repair (unattendedBenchmarkRuns: limited); 12-pre-argocd-bootstrap-sequencing (unattendedBenchmarkRuns: limited); 13-wildcard-tls-route-coverage (unattendedBenchmarkRuns: limited); 14-build-workspace-plane-convergence (unattendedBenchmarkRuns: limited); 15-workspace-runtime-access-convergence (unattendedBenchmarkRuns: limited); 16-event-status-shell (unattendedBenchmarkRuns: limited); 17-log-level-rollup (unattendedBenchmarkRuns: limited); 18-rhel-edge-firewalld-router-repair (unattendedBenchmarkRuns: limited); 19-selinux-registry-volume-label-repair (unattendedBenchmarkRuns: limited); 20-apparmor-dnsmasq-profile-repair (unattendedBenchmarkRuns: limited); 21-rhel-k3s-node-prep-repair (unattendedBenchmarkRuns: limited); 22-nftables-router-ingress-repair (unattendedBenchmarkRuns: limited); 23-rhel-networkmanager-bridge-vlan-repair (unattendedBenchmarkRuns: limited); 24-k3s-registry-mirror-trust-repair (unattendedBenchmarkRuns: limited); 25-metallb-ingress-address-pool-repair (unattendedBenchmarkRuns: limited); 26-traefik-forwarded-header-trust-repair (unattendedBenchmarkRuns: limited); 27-external-dns-rfc2136-repair (unattendedBenchmarkRuns: limited)
- opencode/nemotron-3-super-free: 01-iac-kubernetes-rollout (unattendedBenchmarkRuns: limited); 02-terraform-static-site (unattendedBenchmarkRuns: limited); 03-ansible-nginx-role (unattendedBenchmarkRuns: limited); 04-docker-compose-observability (unattendedBenchmarkRuns: limited); 05-log-audit-script (unattendedBenchmarkRuns: limited); 06-kubernetes-oidc-rbac-repair (unattendedBenchmarkRuns: limited); 07-cnpg-restore-manifest-repair (unattendedBenchmarkRuns: limited); 08-workspace-transplant-bundle-repair (unattendedBenchmarkRuns: limited); 09-gitops-workspace-render-validation (unattendedBenchmarkRuns: limited); 10-bootstrap-phase-validation-repair (unattendedBenchmarkRuns: limited); 11-mcp-openbao-contract-repair (unattendedBenchmarkRuns: limited); 12-pre-argocd-bootstrap-sequencing (unattendedBenchmarkRuns: limited); 13-wildcard-tls-route-coverage (unattendedBenchmarkRuns: limited); 14-build-workspace-plane-convergence (unattendedBenchmarkRuns: limited); 15-workspace-runtime-access-convergence (unattendedBenchmarkRuns: limited); 16-event-status-shell (unattendedBenchmarkRuns: limited); 17-log-level-rollup (unattendedBenchmarkRuns: limited); 18-rhel-edge-firewalld-router-repair (unattendedBenchmarkRuns: limited); 19-selinux-registry-volume-label-repair (unattendedBenchmarkRuns: limited); 20-apparmor-dnsmasq-profile-repair (unattendedBenchmarkRuns: limited); 21-rhel-k3s-node-prep-repair (unattendedBenchmarkRuns: limited); 22-nftables-router-ingress-repair (unattendedBenchmarkRuns: limited); 23-rhel-networkmanager-bridge-vlan-repair (unattendedBenchmarkRuns: limited); 24-k3s-registry-mirror-trust-repair (unattendedBenchmarkRuns: limited); 25-metallb-ingress-address-pool-repair (unattendedBenchmarkRuns: limited); 26-traefik-forwarded-header-trust-repair (unattendedBenchmarkRuns: limited); 27-external-dns-rfc2136-repair (unattendedBenchmarkRuns: limited)


## Capability Matrix

| Capability | Required By Tasks | Supported Models | Limited Models | Unsupported Models | Unknown Models |
| --- | --- | --- | --- | --- | --- |
| unattendedBenchmarkRuns | 01-iac-kubernetes-rollout, 02-terraform-static-site, 03-ansible-nginx-role, 04-docker-compose-observability, 05-log-audit-script, 06-kubernetes-oidc-rbac-repair, 07-cnpg-restore-manifest-repair, 08-workspace-transplant-bundle-repair, 09-gitops-workspace-render-validation, 10-bootstrap-phase-validation-repair, 11-mcp-openbao-contract-repair, 12-pre-argocd-bootstrap-sequencing, 13-wildcard-tls-route-coverage, 14-build-workspace-plane-convergence, 15-workspace-runtime-access-convergence, 16-event-status-shell, 17-log-level-rollup, 18-rhel-edge-firewalld-router-repair, 19-selinux-registry-volume-label-repair, 20-apparmor-dnsmasq-profile-repair, 21-rhel-k3s-node-prep-repair, 22-nftables-router-ingress-repair, 23-rhel-networkmanager-bridge-vlan-repair, 24-k3s-registry-mirror-trust-repair, 25-metallb-ingress-address-pool-repair, 26-traefik-forwarded-header-trust-repair, 27-external-dns-rfc2136-repair | - | opencode/gemini-3-flash, opencode/nemotron-3-super-free | opencode/minimax-m2.5-free | opencode/glm-5, opencode/gemini-3.1-pro |
