from __future__ import annotations

import subprocess
from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
compose_proc = subprocess.run([
    "docker",
    "compose",
    "config",
], cwd=root, check=True, capture_output=True, text=True)
compose = yaml.safe_load(compose_proc.stdout)
prometheus = yaml.safe_load((root / "monitoring" / "prometheus.yml").read_text())

services = compose.get("services", {})
require({"app", "prometheus", "grafana"}.issubset(services.keys()), "app, prometheus, and grafana services are required")

app = services["app"]
prom = services["prometheus"]
grafana = services["grafana"]

require("8080:8080" in (app.get("ports") or []), "app must publish 8080:8080")
require("9090:9090" in (prom.get("ports") or []), "prometheus port mapping missing")
require("3000:3000" in (grafana.get("ports") or []), "grafana port mapping missing")

healthcheck = app.get("healthcheck") or {}
require(healthcheck.get("test") == ["CMD", "curl", "-f", "http://localhost:8080/health"], "app healthcheck must call /health")

depends_on = prom.get("depends_on") or {}
require("app" in depends_on, "prometheus must declare dependency on app")
require("prometheus" in (grafana.get("depends_on") or {}), "grafana must depend on prometheus")

volumes = prom.get("volumes") or []
require(any(str(volume).startswith("./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro") for volume in volumes), "prometheus config mount missing")

scrape_configs = prometheus.get("scrape_configs") or []
app_job = next((job for job in scrape_configs if job.get("job_name") == "app"), None)
require(app_job is not None, "prometheus app scrape job missing")
targets = (app_job.get("static_configs") or [{}])[0].get("targets") or []
require("app:8080" in targets, "prometheus must scrape app:8080")

print("ok")
