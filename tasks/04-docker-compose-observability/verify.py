from __future__ import annotations

from pathlib import Path


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
compose = (root / "docker-compose.yml").read_text()
prom = (root / "monitoring" / "prometheus.yml").read_text()

require("app:" in compose, "app service missing")
require("prometheus:" in compose, "prometheus service missing")
require("grafana:" in compose, "grafana service missing")
require('3000:3000' in compose, "grafana port mapping missing")
require('9090:9090' in compose, "prometheus port mapping missing")
require("test: [\"CMD\", \"curl\", \"-f\", \"http://localhost:8080/health\"]" in compose, "app healthcheck must call /health")
require("depends_on:" in compose, "service dependencies must be declared")
require("./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro" in compose, "prometheus config mount missing")
require("job_name: app" in prom, "prometheus app scrape job missing")
require("app:8080" in prom, "prometheus must scrape app:8080")

print("ok")
