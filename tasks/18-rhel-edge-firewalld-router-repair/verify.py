from __future__ import annotations

from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
policy = yaml.safe_load((root / "firewalld" / "router-policy.yml").read_text())
contract = (root / "docs" / "router-firewall-contract.md").read_text()

require("firewalld on the RHEL edge host remains the source of truth" in contract, "router contract text missing")
require(policy.get("defaultZone") == "drop", "default zone must stay drop for unassigned interfaces")

zones = policy.get("zones") or {}
external = zones.get("external") or {}
internal = zones.get("internal") or {}
lan_to_wan = (policy.get("policies") or {}).get("lanToWan") or {}

zone_owners: dict[str, set[str]] = {}
for zone_name, zone_spec in zones.items():
    for interface in zone_spec.get("interfaces") or []:
        zone_owners.setdefault(interface, set()).add(zone_name)

require(external.get("interfaces") == ["eno1"], "external zone must own the WAN interface eno1")
require(external.get("masquerade") is True, "external zone must enable masquerading")
require(zone_owners.get("eno1") == {"external"}, "eno1 must not be assigned to any zone besides external")
external_services = set(external.get("services") or [])
require(not ({"dns", "dhcp"} & external_services), "external zone must not expose LAN-only dns or dhcp services")

forward_ports = external.get("forwardPorts") or []
forward_map = {
    (entry.get("port"), entry.get("protocol"), entry.get("toAddr"), entry.get("toPort"))
    for entry in forward_ports
}
expected_forward_map = {
    (80, "tcp", "10.42.0.20", 80),
    (443, "tcp", "10.42.0.20", 443),
}
require(forward_map == expected_forward_map, "external zone must forward only 80/tcp and 443/tcp to 10.42.0.20")

require(internal.get("interfaces") == ["br0"], "internal zone must own the LAN bridge br0")
require(internal.get("masquerade") is False, "internal zone must not masquerade")
require(zone_owners.get("br0") == {"internal"}, "br0 must not be assigned to any zone besides internal")
internal_services = set(internal.get("services") or [])
require({"dns", "dhcp", "ssh"}.issubset(internal_services), "internal zone must provide dns, dhcp, and ssh")
require(not (internal.get("forwardPorts") or []), "internal zone must not define ingress forward ports")

require(lan_to_wan.get("ingressZone") == "internal", "lanToWan policy must start from the internal zone")
require(lan_to_wan.get("egressZone") == "external", "lanToWan policy must exit through the external zone")
require(lan_to_wan.get("target") == "ACCEPT", "lanToWan policy must explicitly allow LAN to WAN forwarding")

print("ok")
