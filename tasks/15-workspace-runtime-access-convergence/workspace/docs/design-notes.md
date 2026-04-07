# Runtime Access Convergence Notes

- `platform-ops` should resolve to the `platform-gitops` template and runtime profile.
- The `platform-gitops` runtime profile requires the `platform-gitops` runtime access profile.
- `platform-gitops` runtime access includes ArgoCD application write verbs.
- The resolved registry is generated output and must match the raw request and catalogs.
- The rendered deployment should project the service account token and carry the workspace OIDC group.
