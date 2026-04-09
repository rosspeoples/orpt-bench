# Router nftables runbook

This fixture mirrors the earlier edge-router ruleset before k3s ingress stabilized.

- nftables remains the source of truth.
- Keep a default-drop posture on both `input` and `forward`.
- LAN is `lan0` on `10.42.0.0/24` and WAN is `wan0`.
- LAN clients should reach the internet through source NAT on `wan0`.
- WAN ingress on `80/tcp` and `443/tcp` should DNAT to the ingress VIP `10.42.0.20`.
- Forwarded SYN packets should clamp MSS to the route MTU.
