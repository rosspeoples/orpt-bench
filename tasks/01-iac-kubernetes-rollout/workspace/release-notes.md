# API Rollout Release Notes

- Roll forward the API workload to image `ghcr.io/example/api:1.4.2`.
- The service continues to front the `api` deployment on port `80` and target the container on `8080`.
- This fixture expects a small production-safe baseline: `3` replicas plus HTTP readiness/liveness checks on `/healthz`.
- Keep the workload name `api` and preserve the existing ingress host.
