# Build Workspace Request

- slug: `release-engineering`
- lane: `build`
- pattern: `standard-build`
- hostname: `release-engineering.build.ai.thepeoples.dev`
- access group: `thepeoples_dev_build_release_engineering_users`

The rendered OIDC provider file, workspace catalog entry, and workspace directory
must all match this request exactly.

Platform workflow:

1. update the request JSON
2. run `python3 render.py`
3. commit the regenerated files
