from __future__ import annotations

from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
notes = (root / "docs" / "ingress-vip-contract.md").read_text()
pool = yaml.safe_load((root / "metallb" / "ipaddresspool.yaml").read_text())
advert = yaml.safe_load((root / "metallb" / "l2advertisement.yaml").read_text())
service = yaml.safe_load((root / "services" / "traefik-lb.yaml").read_text())

require("Traefik should hold 10.42.0.240 on the LAN via MetalLB L2" in notes, "ingress VIP contract missing")

require(pool.get("kind") == "IPAddressPool", "IPAddressPool manifest missing")
require(pool.get("apiVersion") == "metallb.io/v1beta1", "IPAddressPool apiVersion must stay metallb.io/v1beta1")
require(pool.get("metadata", {}).get("namespace") == "metallb-system", "IPAddressPool must live in metallb-system")
require(pool.get("metadata", {}).get("name") == "lan-ingress", "IPAddressPool must be named lan-ingress")
pool_spec = pool.get("spec") or {}
require(pool_spec.get("addresses") == ["10.42.0.240-10.42.0.249"], "IPAddressPool must reserve 10.42.0.240-10.42.0.249")
require(pool_spec.get("avoidBuggyIPs") is True, "IPAddressPool must enable avoidBuggyIPs")
require(not pool_spec.get("autoAssign") is False, "IPAddressPool must not disable auto assignment for the ingress pool")

require(advert.get("kind") == "L2Advertisement", "L2Advertisement manifest missing")
require(advert.get("apiVersion") == "metallb.io/v1beta1", "L2Advertisement apiVersion must stay metallb.io/v1beta1")
require(advert.get("metadata", {}).get("namespace") == "metallb-system", "L2Advertisement must live in metallb-system")
require(advert.get("metadata", {}).get("name") == "lan-ingress", "L2Advertisement must be named lan-ingress")
require((advert.get("spec") or {}).get("ipAddressPools") == ["lan-ingress"], "L2Advertisement must target the lan-ingress pool")

require(service.get("kind") == "Service", "Traefik service manifest missing")
require(service.get("apiVersion") == "v1", "Traefik service apiVersion must stay v1")
service_meta = service.get("metadata") or {}
service_spec = service.get("spec") or {}
require(service_meta.get("namespace") == "kube-system", "Traefik service must live in kube-system")
require(service_meta.get("name") == "traefik", "Traefik service name must stay traefik")
require(service_spec.get("type") == "LoadBalancer", "Traefik service must be LoadBalancer")
require(service_spec.get("loadBalancerIP") == "10.42.0.240", "Traefik service must hold 10.42.0.240")
require(service_spec.get("externalTrafficPolicy") == "Local", "Traefik service must preserve client source IPs with Local externalTrafficPolicy")
annotations = service_meta.get("annotations") or {}
require(annotations.get("metallb.io/address-pool") == "lan-ingress", "Traefik service must request the lan-ingress pool")
require(not service_spec.get("externalIPs"), "Traefik service must not use externalIPs for the VIP")

print("ok")
