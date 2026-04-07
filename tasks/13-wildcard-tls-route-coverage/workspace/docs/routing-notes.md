# Routing And TLS Notes

- Build workspace hosts live under `*.build.ai.thepeoples.dev`.
- Shared build portal lives at `build.ai.thepeoples.dev`.
- A wildcard cert for Build should cover both the apex build host and `*.build.ai.thepeoples.dev`.
- Workspace `HTTPRoute` hostnames must stay under the build lane wildcard route space.
- The build kustomization must continue to own the build portal route and certificate.
