from __future__ import annotations

from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace" / "k8s"
deployment = yaml.safe_load((root / "deployment.yaml").read_text())
service = yaml.safe_load((root / "service.yaml").read_text())
ingress = yaml.safe_load((root / "ingress.yaml").read_text())

require(deployment.get("metadata", {}).get("name") == "api", "deployment name must remain api")
require(deployment.get("spec", {}).get("replicas") == 3, "replica count must be 3")

labels = deployment.get("spec", {}).get("template", {}).get("metadata", {}).get("labels") or {}
selector = deployment.get("spec", {}).get("selector", {}).get("matchLabels") or {}
require(labels.get("app") == "api", "deployment template labels must use app=api")
require(selector.get("app") == "api", "deployment selector must use app=api")

container = (deployment.get("spec", {}).get("template", {}).get("spec", {}).get("containers") or [{}])[0]
ports = container.get("ports") or [{}]
container_port = ports[0].get("containerPort") if ports else None
require(container.get("image") == "ghcr.io/example/api:1.4.2", "image must be upgraded to 1.4.2")
require(container_port == 8080, "container port must be 8080")

for probe_name in ["readinessProbe", "livenessProbe"]:
    probe = container.get(probe_name) or {}
    path = ((probe.get("httpGet") or {}).get("path"))
    require(path == "/healthz", f"{probe_name} must call /healthz")

service_selector = service.get("spec", {}).get("selector") or {}
service_ports = service.get("spec", {}).get("ports") or [{}]
require(service_selector.get("app") == "api", "service selector must target app=api")
require(service_ports[0].get("targetPort") == 8080, "service target port must be 8080")

paths = ((ingress.get("spec", {}).get("rules") or [{}])[0].get("http") or {}).get("paths") or [{}]
backend = (paths[0].get("backend") or {}).get("service") or {}
require(backend.get("name") == "api", "ingress must point to api service")
require((backend.get("port") or {}).get("number") == 80, "ingress backend must point to port 80")

print("ok")
