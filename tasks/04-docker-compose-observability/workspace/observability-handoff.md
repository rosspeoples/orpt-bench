# Demo Observability Handoff

- The app listens on port `8080` and exposes `/health`.
- Prometheus should stay reachable on `9090` and scrape the app by service DNS name, not localhost.
- Grafana should stay reachable on `3000`.
- Prometheus should mount `./monitoring/prometheus.yml` read-only.
- The stack should declare service dependencies explicitly so startup order is obvious in the compose model.
