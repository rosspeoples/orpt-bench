# Bootstrap Validation Design Notes

- `preflight` is the day-0 operator gate and must require the cluster SSH and kubeconfig-related environment variables.
- `validate-phase.sh` is phase-specific and must accept `base`, `cnpg`, `gitea`, `seed-gitea`, and `argocd`.
- `make validate-gitea` should invoke `validate-phase.sh gitea`.
- `validate-gitea.yml` must require the OIDC issuer path used by the Gitea bootstrap and assert Ceph RBD-backed storage classes.
- Missing or mistyped phase names should fail fast.
