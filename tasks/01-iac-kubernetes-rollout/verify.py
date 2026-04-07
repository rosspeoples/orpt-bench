from __future__ import annotations

import sys
from pathlib import Path


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace" / "k8s"
deployment = (root / "deployment.yaml").read_text()
service = (root / "service.yaml").read_text()
ingress = (root / "ingress.yaml").read_text()

require("name: api" in deployment, "deployment name must remain api")
require("image: ghcr.io/example/api:1.4.2" in deployment, "image must be upgraded to 1.4.2")
require("replicas: 3" in deployment, "replica count must be 3")
require("containerPort: 8080" in deployment, "container port must be 8080")
require("readinessProbe:" in deployment, "readiness probe required")
require("livenessProbe:" in deployment, "liveness probe required")
require("path: /healthz" in deployment, "health path must be /healthz")
require("app: api" in service, "service selector must target app=api")
require("targetPort: 8080" in service, "service target port must be 8080")
require("service:\n            name: api" in ingress, "ingress must point to api service")
require("number: 80" in ingress, "ingress backend must point to port 80")

print("ok")
