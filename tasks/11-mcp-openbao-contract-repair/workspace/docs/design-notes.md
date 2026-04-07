# Build MCP Contract Notes

- Build workspace MCP access is declared on the workspace record under `mcpAccess`.
- Provider metadata defines the target OpenBao secret suffix and env var contract.
- Gitea provider:
  - secret key: `GITEA_TOKEN`
  - remote path suffix: `mcp/gitea`
- ArgoCD provider:
  - secret key: `ARGOCD_AUTH_TOKEN`
  - remote path suffix: `mcp/argocd`
- Registry targets must be workspace-scoped under:
  - `thepeoples.dev/ai-build/workspaces/<slug>/mcp/<provider>`
- `external-bootstrap` is only valid for shared bootstrap copy flows like current Gitea.
- `generated-account-token` is the intended ArgoCD path.
- The plugin env contract must match the provider catalog secret key.
