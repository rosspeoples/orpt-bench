from __future__ import annotations

from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
notes = (root / "docs" / "ingress-proxy-chain.md").read_text()
config = yaml.safe_load((root / "k3s" / "traefik-config.yaml").read_text())
service = yaml.safe_load((root / "k3s" / "traefik-service.yaml").read_text())

require("trust forwarded headers only from the edge router and loopback" in notes, "proxy-chain notes missing")

require(config.get("kind") == "HelmChartConfig", "Traefik config must stay a HelmChartConfig")
require(config.get("apiVersion") == "helm.cattle.io/v1", "Traefik config apiVersion must stay helm.cattle.io/v1")
meta = config.get("metadata") or {}
require(meta.get("name") == "traefik", "HelmChartConfig name must stay traefik")
require(meta.get("namespace") == "kube-system", "HelmChartConfig namespace must stay kube-system")

values = yaml.safe_load((config.get("spec") or {}).get("valuesContent") or "") or {}
ports = values.get("ports") or {}
require(set(ports) >= {"web", "websecure"}, "Traefik valuesContent must define both web and websecure ports")
for port_name in ("web", "websecure"):
    port = ports.get(port_name) or {}
    forwarded = port.get("forwardedHeaders") or {}
    trusted = forwarded.get("trustedIPs") or []
    require(set(trusted) == {"10.42.0.1/32", "127.0.0.1/32"}, f"{port_name} must trust only the router and loopback forwarded headers")
    require(forwarded.get("insecure") in (None, False), f"{port_name} must not enable insecure forwarded headers")

service_spec = service.get("spec") or {}
require(service.get("kind") == "Service", "Traefik service manifest missing")
require(service.get("apiVersion") == "v1", "Traefik service apiVersion must stay v1")
require(service.get("metadata", {}).get("name") == "traefik", "Traefik service name must stay traefik")
require(service.get("metadata", {}).get("namespace") == "kube-system", "Traefik service must stay in kube-system")
require(service_spec.get("type") == "LoadBalancer", "Traefik service must stay LoadBalancer")
require(service_spec.get("externalTrafficPolicy") == "Local", "Traefik service must use Local externalTrafficPolicy")

print("ok")
