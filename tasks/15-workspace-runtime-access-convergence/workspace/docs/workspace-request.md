# Build Workspace Runtime Request

- workspace slug: `release-engineering`
- display name: `Release Engineering`
- pattern: `platform-ops`
- template: `platform-gitops`
- runtime profile: `platform-gitops`
- runtime access profile: `platform-gitops`
- repo access profile: `gitea-write`
- hostname: `release-engineering.build.ai.thepeoples.dev`
- OIDC group: `thepeoples_dev_build_release_engineering_users`

Expected runtime posture:

- rendered workspace uses the platform image and platform guidance profile
- runtime access allows ArgoCD application writes
- rendered deployment projects the service account token
- stale old-slug rendered artifacts must be removed
