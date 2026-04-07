# Pre-ArgoCD Bootstrap Sequencing Notes

- The bootstrap flow stays phase-oriented and explicit.
- Expected wrapper order:
  1. preflight
  2. k3s
  3. base
  4. gitea
  5. seed-gitea
  6. argocd
- The repo must exist in Gitea before ArgoCD bootstrap.
- OpenBao post-bootstrap configuration should happen only after the main bootstrap-all playbook completes.
- `bootstrap-cnpg` remains part of the Gitea-era dependency path, but the current operator recommendation keeps PostgreSQL immediately before Gitea inside the Gitea bootstrap phase for operator simplicity.
