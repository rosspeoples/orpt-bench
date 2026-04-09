# Router link plan

The edge router is managed with NetworkManager or nmstate on RHEL-family hosts.

- `eno1` is the WAN uplink and stays on DHCP.
- `eno2` is the LAN trunk port and should not carry a standalone IP address.
- `br0` is the bridge for local switching and must enable VLAN filtering.
- The routed LAN for peers lives on `br0.42` with address `10.42.0.1/24`.
- The default route must remain on the WAN uplink rather than the LAN VLAN.
