# Model Summary

| Rank | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | opencode/kimi-k2.5 | 0.89 | 0.783 | 0.857 | 89% | 2 | 375 | 14.25 | 2464.6 | 0.9122 | yes | yes |  |
| 2 | opencode/big-pickle | 0.67 | 0.577 | 0.640 | 67% | 1 | 414 | 15.39 | 2188.2 | 0.0000 | yes | yes |  |
| 3 | opencode/minimax-m2.5 | 0.56 | 0.417 | 0.514 | 56% | 1 | 417 | 18.87 | 1935.0 | 0.6413 | yes | yes |  |

# Limited Comparability

| Rank | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | ORPT | Total Wall Time (s) | Total Cost (USD) | Eligible | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| - | No runs yet | - | - | - | - | - | - | - | - | - | - | - | - |

# Task Detail

| Task | Model | Score | Value Score | Composite Score | Success Rate | DNF | Request Count | Avg Requests | Total Wall Time (s) | Total Cost (USD) | Avg Steps | Comparable | Cohort Note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01-iac-kubernetes-rollout | opencode/kimi-k2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 21 | 21.00 | 131.6 | 0.0495 | 22.00 | yes |  |
| 01-iac-kubernetes-rollout | opencode/big-pickle | 0.00 | 0.000 | 0.000 | 0% | 0 | 19 | 19.00 | 58.8 | 0.0000 | 20.00 | yes |  |
| 01-iac-kubernetes-rollout | opencode/minimax-m2.5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 17 | 17.00 | 61.0 | 0.0232 | 18.00 | yes |  |
| 02-terraform-static-site | opencode/big-pickle | 1.00 | 0.382 | 0.815 | 100% | 0 | 23 | 23.00 | 164.6 | 0.0000 | 24.00 | yes |  |
| 02-terraform-static-site | opencode/kimi-k2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 5 | 5.00 | 41.5 | 0.0152 | 6.00 | yes |  |
| 02-terraform-static-site | opencode/minimax-m2.5 | 1.00 | 0.583 | 0.875 | 100% | 0 | 12 | 12.00 | 70.8 | 0.0170 | 13.00 | yes |  |
| 03-ansible-nginx-role | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 7 | 7.00 | 43.1 | 0.0000 | 8.00 | yes |  |
| 03-ansible-nginx-role | opencode/kimi-k2.5 | 1.00 | 0.962 | 0.989 | 100% | 0 | 7 | 7.00 | 52.4 | 0.0200 | 8.00 | yes |  |
| 03-ansible-nginx-role | opencode/minimax-m2.5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 14 | 14.00 | 50.5 | 0.0196 | 15.00 | yes |  |
| 04-docker-compose-observability | opencode/kimi-k2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 31 | 31.00 | 299.6 | 0.0897 | 32.00 | yes |  |
| 04-docker-compose-observability | opencode/big-pickle | 0.00 | 0.000 | 0.000 | 0% | 0 | 9 | 9.00 | 44.9 | 0.0000 | 10.00 | yes |  |
| 04-docker-compose-observability | opencode/minimax-m2.5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 10 | 10.00 | 37.5 | 0.0124 | 11.00 | yes |  |
| 05-log-audit-script | opencode/big-pickle | 0.00 | 0.000 | 0.000 | 0% | 1 | 12 | 12.00 | 75.1 | 0.0000 | 13.00 | yes |  |
| 05-log-audit-script | opencode/kimi-k2.5 | 0.00 | 0.000 | 0.000 | 0% | 1 | 0 | n/a | 75.1 | n/a | 1.00 | yes |  |
| 05-log-audit-script | opencode/minimax-m2.5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 9 | 9.00 | 43.7 | 0.0139 | 10.00 | yes |  |
| 06-kubernetes-oidc-rbac-repair | opencode/kimi-k2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 17 | 17.00 | 72.5 | 0.0380 | 17.00 | yes |  |
| 06-kubernetes-oidc-rbac-repair | opencode/big-pickle | 0.00 | 0.000 | 0.000 | 0% | 0 | 14 | 14.00 | 96.0 | 0.0000 | 15.00 | yes |  |
| 06-kubernetes-oidc-rbac-repair | opencode/minimax-m2.5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 9 | 9.00 | 57.4 | 0.0135 | 10.00 | yes |  |
| 07-cnpg-restore-manifest-repair | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 9 | 9.00 | 36.8 | 0.0000 | 10.00 | yes |  |
| 07-cnpg-restore-manifest-repair | opencode/kimi-k2.5 | 1.00 | 0.727 | 0.918 | 100% | 0 | 11 | 11.00 | 53.5 | 0.0261 | 12.00 | yes |  |
| 07-cnpg-restore-manifest-repair | opencode/minimax-m2.5 | 1.00 | 0.898 | 0.969 | 100% | 0 | 9 | 9.00 | 62.9 | 0.0168 | 10.00 | yes |  |
| 08-workspace-transplant-bundle-repair | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 9 | 9.00 | 25.2 | 0.0000 | 10.00 | yes |  |
| 08-workspace-transplant-bundle-repair | opencode/minimax-m2.5 | 1.00 | 0.653 | 0.896 | 100% | 0 | 17 | 17.00 | 50.9 | 0.0244 | 18.00 | yes |  |
| 08-workspace-transplant-bundle-repair | opencode/kimi-k2.5 | 0.00 | 0.000 | 0.000 | 0% | 1 | 26 | 26.00 | 300.1 | n/a | 27.00 | yes |  |
| 09-gitops-workspace-render-validation | opencode/big-pickle | 1.00 | 0.938 | 0.981 | 100% | 0 | 10 | 10.00 | 68.9 | 0.0000 | 11.00 | yes |  |
| 09-gitops-workspace-render-validation | opencode/kimi-k2.5 | 1.00 | 0.679 | 0.904 | 100% | 0 | 13 | 13.00 | 68.6 | 0.0347 | 14.00 | yes |  |
| 09-gitops-workspace-render-validation | opencode/minimax-m2.5 | 1.00 | 0.921 | 0.976 | 100% | 0 | 12 | 12.00 | 50.0 | 0.0193 | 13.00 | yes |  |
| 10-bootstrap-phase-validation-repair | opencode/kimi-k2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 12 | 12.00 | 89.8 | 0.0380 | 13.00 | yes |  |
| 10-bootstrap-phase-validation-repair | opencode/minimax-m2.5 | 1.00 | 0.682 | 0.905 | 100% | 0 | 23 | 23.00 | 126.0 | 0.0404 | 24.00 | yes |  |
| 10-bootstrap-phase-validation-repair | opencode/big-pickle | 0.00 | 0.000 | 0.000 | 0% | 0 | 22 | 22.00 | 128.3 | 0.0000 | 23.00 | yes |  |
| 11-mcp-openbao-contract-repair | opencode/big-pickle | 1.00 | 0.928 | 0.978 | 100% | 0 | 13 | 13.00 | 32.5 | 0.0000 | 14.00 | yes |  |
| 11-mcp-openbao-contract-repair | opencode/kimi-k2.5 | 1.00 | 0.678 | 0.903 | 100% | 0 | 14 | 14.00 | 49.7 | 0.0328 | 15.00 | yes |  |
| 11-mcp-openbao-contract-repair | opencode/minimax-m2.5 | 1.00 | 0.929 | 0.979 | 100% | 0 | 11 | 11.00 | 47.1 | 0.0187 | 12.00 | yes |  |
| 12-pre-argocd-bootstrap-sequencing | opencode/big-pickle | 1.00 | 0.926 | 0.978 | 100% | 0 | 17 | 17.00 | 263.2 | 0.0000 | 18.00 | yes |  |
| 12-pre-argocd-bootstrap-sequencing | opencode/kimi-k2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 17 | 17.00 | 178.9 | 0.0420 | 18.00 | yes |  |
| 12-pre-argocd-bootstrap-sequencing | opencode/minimax-m2.5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 9 | 9.00 | 56.8 | 0.0171 | 10.00 | yes |  |
| 13-wildcard-tls-route-coverage | opencode/big-pickle | 1.00 | 0.827 | 0.948 | 100% | 0 | 13 | 13.00 | 68.1 | 0.0000 | 14.00 | yes |  |
| 13-wildcard-tls-route-coverage | opencode/kimi-k2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 9 | 9.00 | 60.1 | 0.0262 | 10.00 | yes |  |
| 13-wildcard-tls-route-coverage | opencode/minimax-m2.5 | 1.00 | 0.266 | 0.780 | 100% | 0 | 51 | 51.00 | 156.2 | 0.0719 | 52.00 | yes |  |
| 14-build-workspace-plane-convergence | opencode/big-pickle | 1.00 | 0.826 | 0.948 | 100% | 0 | 22 | 22.00 | 147.0 | 0.0000 | 23.00 | yes |  |
| 14-build-workspace-plane-convergence | opencode/kimi-k2.5 | 1.00 | 0.927 | 0.978 | 100% | 0 | 18 | 18.00 | 88.5 | 0.0519 | 19.00 | yes |  |
| 14-build-workspace-plane-convergence | opencode/minimax-m2.5 | 1.00 | 0.852 | 0.956 | 100% | 0 | 25 | 25.00 | 94.3 | 0.0418 | 26.00 | yes |  |
| 15-workspace-runtime-access-convergence | opencode/kimi-k2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 21 | 21.00 | 101.5 | 0.0633 | 22.00 | yes |  |
| 15-workspace-runtime-access-convergence | opencode/big-pickle | 0.00 | 0.000 | 0.000 | 0% | 0 | 30 | 30.00 | 145.9 | 0.0000 | 31.00 | yes |  |
| 15-workspace-runtime-access-convergence | opencode/minimax-m2.5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 17 | 17.00 | 92.2 | 0.0306 | 18.00 | yes |  |
| 16-event-status-shell | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 6 | 6.00 | 17.0 | 0.0000 | 7.00 | yes |  |
| 16-event-status-shell | opencode/kimi-k2.5 | 1.00 | 0.713 | 0.914 | 100% | 0 | 9 | 9.00 | 37.1 | 0.0205 | 10.00 | yes |  |
| 16-event-status-shell | opencode/minimax-m2.5 | 0.00 | 0.000 | 0.000 | 0% | 1 | 12 | 12.00 | 45.1 | 0.0000 | 13.00 | yes |  |
| 17-log-level-rollup | opencode/big-pickle | 1.00 | 0.924 | 0.977 | 100% | 0 | 7 | 7.00 | 54.2 | 0.0000 | 8.00 | yes |  |
| 17-log-level-rollup | opencode/kimi-k2.5 | 1.00 | 0.852 | 0.956 | 100% | 0 | 10 | 10.00 | 36.5 | 0.0223 | 11.00 | yes |  |
| 17-log-level-rollup | opencode/minimax-m2.5 | 1.00 | 0.676 | 0.903 | 100% | 0 | 14 | 14.00 | 53.7 | 0.0225 | 14.00 | yes |  |
| 18-rhel-edge-firewalld-router-repair | opencode/big-pickle | 1.00 | 0.802 | 0.941 | 100% | 0 | 31 | 31.00 | 102.7 | 0.0000 | 32.00 | yes |  |
| 18-rhel-edge-firewalld-router-repair | opencode/minimax-m2.5 | 1.00 | 0.989 | 0.997 | 100% | 0 | 19 | 19.00 | 108.3 | 0.0302 | 20.00 | yes |  |
| 18-rhel-edge-firewalld-router-repair | opencode/kimi-k2.5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 7 | 7.00 | 43.1 | 0.0198 | 8.00 | yes |  |
| 19-selinux-registry-volume-label-repair | opencode/kimi-k2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 10 | 10.00 | 42.5 | 0.0254 | 11.00 | yes |  |
| 19-selinux-registry-volume-label-repair | opencode/big-pickle | 0.00 | 0.000 | 0.000 | 0% | 0 | 8 | 8.00 | 67.3 | 0.0000 | 9.00 | yes |  |
| 19-selinux-registry-volume-label-repair | opencode/minimax-m2.5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 7 | 7.00 | 33.5 | 0.0098 | 8.00 | yes |  |
| 20-apparmor-dnsmasq-profile-repair | opencode/big-pickle | 1.00 | 0.798 | 0.939 | 100% | 0 | 23 | 23.00 | 82.1 | 0.0000 | 24.00 | yes |  |
| 20-apparmor-dnsmasq-profile-repair | opencode/kimi-k2.5 | 1.00 | 0.814 | 0.944 | 100% | 0 | 14 | 14.00 | 96.8 | 0.0377 | 15.00 | yes |  |
| 20-apparmor-dnsmasq-profile-repair | opencode/minimax-m2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 14 | 14.00 | 81.1 | 0.0232 | 15.00 | yes |  |
| 21-rhel-k3s-node-prep-repair | opencode/big-pickle | 1.00 | 0.891 | 0.967 | 100% | 0 | 31 | 31.00 | 138.9 | 0.0000 | 32.00 | yes |  |
| 21-rhel-k3s-node-prep-repair | opencode/kimi-k2.5 | 1.00 | 0.991 | 0.997 | 100% | 0 | 24 | 24.00 | 145.5 | 0.0612 | 25.00 | yes |  |
| 21-rhel-k3s-node-prep-repair | opencode/minimax-m2.5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 9 | 9.00 | 65.7 | 0.0161 | 10.00 | yes |  |
| 22-nftables-router-ingress-repair | opencode/kimi-k2.5 | 1.00 | 0.622 | 0.887 | 100% | 0 | 16 | 16.00 | 80.6 | 0.0369 | 17.00 | yes |  |
| 22-nftables-router-ingress-repair | opencode/minimax-m2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 11 | 11.00 | 60.5 | 0.0181 | 12.00 | yes |  |
| 22-nftables-router-ingress-repair | opencode/big-pickle | 0.00 | 0.000 | 0.000 | 0% | 0 | 17 | 17.00 | 52.4 | 0.0000 | 18.00 | yes |  |
| 23-rhel-networkmanager-bridge-vlan-repair | opencode/big-pickle | 1.00 | 0.693 | 0.908 | 100% | 0 | 16 | 16.00 | 66.0 | 0.0000 | 17.00 | yes |  |
| 23-rhel-networkmanager-bridge-vlan-repair | opencode/kimi-k2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 8 | 8.00 | 50.1 | 0.0248 | 9.00 | yes |  |
| 23-rhel-networkmanager-bridge-vlan-repair | opencode/minimax-m2.5 | 1.00 | 0.263 | 0.779 | 100% | 0 | 41 | 41.00 | 175.2 | 0.0676 | 42.00 | yes |  |
| 24-k3s-registry-mirror-trust-repair | opencode/big-pickle | 1.00 | 1.000 | 1.000 | 100% | 0 | 5 | 5.00 | 17.4 | 0.0000 | 6.00 | yes |  |
| 24-k3s-registry-mirror-trust-repair | opencode/kimi-k2.5 | 1.00 | 0.336 | 0.801 | 100% | 0 | 15 | 15.00 | 63.9 | 0.0306 | 16.00 | yes |  |
| 24-k3s-registry-mirror-trust-repair | opencode/minimax-m2.5 | 1.00 | 0.757 | 0.927 | 100% | 0 | 7 | 7.00 | 32.8 | 0.0118 | 8.00 | yes |  |
| 25-metallb-ingress-address-pool-repair | opencode/big-pickle | 1.00 | 0.948 | 0.985 | 100% | 0 | 18 | 18.00 | 57.0 | 0.0000 | 19.00 | yes |  |
| 25-metallb-ingress-address-pool-repair | opencode/kimi-k2.5 | 1.00 | 0.898 | 0.969 | 100% | 0 | 16 | 16.00 | 97.9 | 0.0428 | 17.00 | yes |  |
| 25-metallb-ingress-address-pool-repair | opencode/minimax-m2.5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 13 | 13.00 | 63.8 | 0.0183 | 14.00 | yes |  |
| 26-traefik-forwarded-header-trust-repair | opencode/kimi-k2.5 | 1.00 | 0.950 | 0.985 | 100% | 0 | 13 | 13.00 | 61.2 | 0.0331 | 14.00 | yes |  |
| 26-traefik-forwarded-header-trust-repair | opencode/minimax-m2.5 | 1.00 | 0.784 | 0.935 | 100% | 0 | 17 | 17.00 | 113.2 | 0.0286 | 18.00 | yes |  |
| 26-traefik-forwarded-header-trust-repair | opencode/big-pickle | 0.00 | 0.000 | 0.000 | 0% | 0 | 6 | 6.00 | 20.8 | 0.0000 | 7.00 | yes |  |
| 27-external-dns-rfc2136-repair | opencode/big-pickle | 1.00 | 0.686 | 0.906 | 100% | 0 | 17 | 17.00 | 114.1 | 0.0000 | 18.00 | yes |  |
| 27-external-dns-rfc2136-repair | opencode/kimi-k2.5 | 1.00 | 1.000 | 1.000 | 100% | 0 | 11 | 11.00 | 46.1 | 0.0299 | 12.00 | yes |  |
| 27-external-dns-rfc2136-repair | opencode/minimax-m2.5 | 0.00 | 0.000 | 0.000 | 0% | 0 | 8 | 8.00 | 45.1 | 0.0144 | 9.00 | yes |  |

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
| 01-iac-kubernetes-rollout | opencode/kimi-k2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 02-terraform-static-site | opencode/kimi-k2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 03-ansible-nginx-role | opencode/kimi-k2.5 | 0.962 | 1.000 | 1.000 | 0.823 |
| 04-docker-compose-observability | opencode/kimi-k2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 06-kubernetes-oidc-rbac-repair | opencode/kimi-k2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 07-cnpg-restore-manifest-repair | opencode/kimi-k2.5 | 0.727 | 0.818 | 0.645 | 0.687 |
| 09-gitops-workspace-render-validation | opencode/kimi-k2.5 | 0.679 | 0.769 | 0.557 | 0.728 |
| 10-bootstrap-phase-validation-repair | opencode/kimi-k2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 11-mcp-openbao-contract-repair | opencode/kimi-k2.5 | 0.678 | 0.786 | 0.571 | 0.655 |
| 12-pre-argocd-bootstrap-sequencing | opencode/kimi-k2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 13-wildcard-tls-route-coverage | opencode/kimi-k2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 14-build-workspace-plane-convergence | opencode/kimi-k2.5 | 0.927 | 1.000 | 0.806 | 1.000 |
| 15-workspace-runtime-access-convergence | opencode/kimi-k2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 16-event-status-shell | opencode/kimi-k2.5 | 0.713 | 0.667 | 1.000 | 0.458 |
| 17-log-level-rollup | opencode/kimi-k2.5 | 0.852 | 0.700 | 1.000 | 1.000 |
| 19-selinux-registry-volume-label-repair | opencode/kimi-k2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 20-apparmor-dnsmasq-profile-repair | opencode/kimi-k2.5 | 0.814 | 1.000 | 0.615 | 0.837 |
| 21-rhel-k3s-node-prep-repair | opencode/kimi-k2.5 | 0.991 | 1.000 | 1.000 | 0.955 |
| 22-nftables-router-ingress-repair | opencode/kimi-k2.5 | 0.622 | 0.688 | 0.491 | 0.750 |
| 23-rhel-networkmanager-bridge-vlan-repair | opencode/kimi-k2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 24-k3s-registry-mirror-trust-repair | opencode/kimi-k2.5 | 0.336 | 0.333 | 0.384 | 0.272 |
| 25-metallb-ingress-address-pool-repair | opencode/kimi-k2.5 | 0.898 | 1.000 | 1.000 | 0.582 |
| 26-traefik-forwarded-header-trust-repair | opencode/kimi-k2.5 | 0.950 | 1.000 | 0.863 | 1.000 |
| 27-external-dns-rfc2136-repair | opencode/kimi-k2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 02-terraform-static-site | opencode/big-pickle | 0.382 | 0.217 | 1.000 | 0.252 |
| 03-ansible-nginx-role | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 07-cnpg-restore-manifest-repair | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 08-workspace-transplant-bundle-repair | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 09-gitops-workspace-render-validation | opencode/big-pickle | 0.938 | 1.000 | 1.000 | 0.726 |
| 11-mcp-openbao-contract-repair | opencode/big-pickle | 0.928 | 0.846 | 1.000 | 1.000 |
| 12-pre-argocd-bootstrap-sequencing | opencode/big-pickle | 0.926 | 1.000 | 1.000 | 0.680 |
| 13-wildcard-tls-route-coverage | opencode/big-pickle | 0.827 | 0.692 | 1.000 | 0.882 |
| 14-build-workspace-plane-convergence | opencode/big-pickle | 0.826 | 0.818 | 1.000 | 0.602 |
| 16-event-status-shell | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 17-log-level-rollup | opencode/big-pickle | 0.924 | 1.000 | 1.000 | 0.673 |
| 18-rhel-edge-firewalld-router-repair | opencode/big-pickle | 0.802 | 0.613 | 1.000 | 1.000 |
| 20-apparmor-dnsmasq-profile-repair | opencode/big-pickle | 0.798 | 0.609 | 1.000 | 0.988 |
| 21-rhel-k3s-node-prep-repair | opencode/big-pickle | 0.891 | 0.774 | 1.000 | 1.000 |
| 23-rhel-networkmanager-bridge-vlan-repair | opencode/big-pickle | 0.693 | 0.500 | 1.000 | 0.760 |
| 24-k3s-registry-mirror-trust-repair | opencode/big-pickle | 1.000 | 1.000 | 1.000 | 1.000 |
| 25-metallb-ingress-address-pool-repair | opencode/big-pickle | 0.948 | 0.889 | 1.000 | 1.000 |
| 27-external-dns-rfc2136-repair | opencode/big-pickle | 0.686 | 0.647 | 1.000 | 0.403 |
| 02-terraform-static-site | opencode/minimax-m2.5 | 0.583 | 0.417 | 0.894 | 0.586 |
| 07-cnpg-restore-manifest-repair | opencode/minimax-m2.5 | 0.898 | 1.000 | 1.000 | 0.585 |
| 08-workspace-transplant-bundle-repair | opencode/minimax-m2.5 | 0.653 | 0.529 | 1.000 | 0.495 |
| 09-gitops-workspace-render-validation | opencode/minimax-m2.5 | 0.921 | 0.833 | 1.000 | 1.000 |
| 10-bootstrap-phase-validation-repair | opencode/minimax-m2.5 | 0.682 | 0.522 | 0.939 | 0.713 |
| 11-mcp-openbao-contract-repair | opencode/minimax-m2.5 | 0.929 | 1.000 | 1.000 | 0.690 |
| 13-wildcard-tls-route-coverage | opencode/minimax-m2.5 | 0.266 | 0.176 | 0.364 | 0.385 |
| 14-build-workspace-plane-convergence | opencode/minimax-m2.5 | 0.852 | 0.720 | 1.000 | 0.939 |
| 17-log-level-rollup | opencode/minimax-m2.5 | 0.676 | 0.500 | 0.992 | 0.680 |
| 18-rhel-edge-firewalld-router-repair | opencode/minimax-m2.5 | 0.989 | 1.000 | 1.000 | 0.948 |
| 20-apparmor-dnsmasq-profile-repair | opencode/minimax-m2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 22-nftables-router-ingress-repair | opencode/minimax-m2.5 | 1.000 | 1.000 | 1.000 | 1.000 |
| 23-rhel-networkmanager-bridge-vlan-repair | opencode/minimax-m2.5 | 0.263 | 0.195 | 0.367 | 0.286 |
| 24-k3s-registry-mirror-trust-repair | opencode/minimax-m2.5 | 0.757 | 0.714 | 1.000 | 0.530 |
| 26-traefik-forwarded-header-trust-repair | opencode/minimax-m2.5 | 0.784 | 0.765 | 1.000 | 0.540 |

# Pricing Provenance

| Model | Benchmark Price $/1M | Reference Price $/1M | Price Source | Price Type | Price Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| opencode/kimi-k2.5 | 0.717025 | n/a | openrouter | automatic-openrouter-primary | medium | Primary blended price derived automatically from OpenRouter listing moonshotai/kimi-k2.5 using a 3:1 input:output blend. |
| opencode/big-pickle | n/a | n/a | manual | n/a | n/a | No trustworthy automatic pricing reference found yet, so cost is currently unknown. |
| opencode/minimax-m2.5 | 0.336 | n/a | openrouter | automatic-openrouter-primary | medium | Primary blended price derived automatically from OpenRouter listing minimax/minimax-m2.5 using a 3:1 input:output blend. |

## Capability Coverage

- Fully comparable models for the current task set: opencode/kimi-k2.5, opencode/big-pickle, opencode/minimax-m2.5
- Models with limited comparability: none
- Task set capability requirements: unattendedBenchmarkRuns


## Capability Matrix

| Capability | Required By Tasks | Supported Models | Limited Models | Unsupported Models | Unknown Models |
| --- | --- | --- | --- | --- | --- |
| unattendedBenchmarkRuns | 01-iac-kubernetes-rollout, 02-terraform-static-site, 03-ansible-nginx-role, 04-docker-compose-observability, 05-log-audit-script, 06-kubernetes-oidc-rbac-repair, 07-cnpg-restore-manifest-repair, 08-workspace-transplant-bundle-repair, 09-gitops-workspace-render-validation, 10-bootstrap-phase-validation-repair, 11-mcp-openbao-contract-repair, 12-pre-argocd-bootstrap-sequencing, 13-wildcard-tls-route-coverage, 14-build-workspace-plane-convergence, 15-workspace-runtime-access-convergence, 16-event-status-shell, 17-log-level-rollup, 18-rhel-edge-firewalld-router-repair, 19-selinux-registry-volume-label-repair, 20-apparmor-dnsmasq-profile-repair, 21-rhel-k3s-node-prep-repair, 22-nftables-router-ingress-repair, 23-rhel-networkmanager-bridge-vlan-repair, 24-k3s-registry-mirror-trust-repair, 25-metallb-ingress-address-pool-repair, 26-traefik-forwarded-header-trust-repair, 27-external-dns-rfc2136-repair | - | - | - | opencode/kimi-k2.5, opencode/big-pickle, opencode/minimax-m2.5 |
