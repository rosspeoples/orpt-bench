from __future__ import annotations

from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
state = yaml.safe_load((root / "nmstate" / "router-network.yml").read_text())
notes = (root / "docs" / "router-link-plan.md").read_text()

require("managed with NetworkManager or nmstate on RHEL-family hosts" in notes, "router link plan missing RHEL NetworkManager guidance")

interface_entries = state.get("interfaces") or []
interface_counts: dict[str, int] = {}
for entry in interface_entries:
    name = entry.get("name")
    if name:
        interface_counts[name] = interface_counts.get(name, 0) + 1

for name in ("eno1", "eno2", "br0", "br0.42"):
    require(interface_counts.get(name) == 1, f"{name} must be defined exactly once")

interfaces = {entry.get("name"): entry for entry in interface_entries}
eno1 = interfaces.get("eno1") or {}
eno2 = interfaces.get("eno2") or {}
br0 = interfaces.get("br0") or {}
br0_42 = interfaces.get("br0.42") or {}

require(eno1.get("type") == "ethernet", "eno1 must remain an ethernet interface")
eno1_ipv4 = eno1.get("ipv4") or {}
require(eno1_ipv4.get("enabled") is True and eno1_ipv4.get("dhcp") is True, "eno1 must use DHCP for WAN")

require(eno2.get("type") == "ethernet", "eno2 must remain the LAN trunk interface")
eno2_ipv4 = eno2.get("ipv4") or {}
require(eno2_ipv4.get("enabled") is False, "eno2 must not carry a standalone IPv4 address")

require(br0.get("type") == "linux-bridge", "br0 bridge missing")
bridge = br0.get("bridge") or {}
bridge_options = bridge.get("options") or {}
require(bridge_options.get("vlan-filtering") is True, "br0 must enable vlan-filtering")
bridge_ports = bridge.get("port") or []
require({port.get("name") for port in bridge_ports} == {"eno2"}, "br0 must include only eno2 as a bridge port")

require(br0_42.get("type") == "vlan", "br0.42 VLAN interface missing")
vlan = br0_42.get("vlan") or {}
require(vlan.get("base-iface") == "br0", "br0.42 must be based on br0")
require(vlan.get("id") == 42, "br0.42 must use VLAN ID 42")
br0_42_ipv4 = br0_42.get("ipv4") or {}
addresses = br0_42_ipv4.get("address") or []
require(br0_42_ipv4.get("enabled") is True and br0_42_ipv4.get("dhcp") is False, "br0.42 must use a static LAN address")
require(any(addr.get("ip") == "10.42.0.1" and addr.get("prefix-length") == 24 for addr in addresses), "br0.42 must carry 10.42.0.1/24")

routes = (state.get("routes") or {}).get("config") or []
default_routes = [route for route in routes if route.get("destination") == "0.0.0.0/0"]
require(len(default_routes) == 1, "router state must define exactly one default route")
require(default_routes[0].get("next-hop-interface") == "eno1", "default route must point to eno1")

print("ok")
