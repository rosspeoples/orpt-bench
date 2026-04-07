# Build Workspace Request

- workspace slug: `release-engineering`
- display name: `Release Engineering`
- pattern: `platform-ops`
- budget policy: `standard-interactive`
- runtime profile: `platform-gitops`
- repo access profile: `gitea-write`
- hostname: `release-engineering.build.ai.thepeoples.dev`
- OIDC group: `thepeoples_dev_build_release_engineering_users`
- allowed repo: `benchmarks/orpt-bench`
- allowed ArgoCD application: `platform-build`

The raw workspace catalogs, generated registry, OIDC provider file, MCP registry,
and rendered workspace files must all agree with this request.

Repair flow:

1. fix `request.json`
2. run `python3 render.py`
3. confirm generated outputs replace stale old-slug artifacts
