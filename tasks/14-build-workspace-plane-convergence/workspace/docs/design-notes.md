# Build Workspace Plane Design Notes

- The raw workspace catalog is the input source of truth for workspace records.
- The resolved workspace-registry is generated output and must not drift from the inputs.
- `platform-ops` workspaces use the `platform-gitops` runtime profile and may project both Gitea and ArgoCD MCP integrations.
- Build workspace hostnames live under `*.build.ai.thepeoples.dev`.
- Workspace-scoped MCP records must publish to `thepeoples.dev/ai-build/workspaces/<slug>/mcp/<provider>`.
- Rendered output must live under `platform/build/workspaces/<slug>/` and stale old-slug outputs must be removed.
