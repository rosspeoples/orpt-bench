# Edge firewall contract

The peer edge host is a RHEL 9 router.

- `firewalld` on the RHEL edge host remains the source of truth.
- WAN is `eno1` and must stay in the `external` zone.
- LAN is bridged on `br0` and must stay in the `internal` zone.
- Only the external zone performs masquerading.
- LAN-only services stay on the internal zone: `dns`, `dhcp`, and `ssh`.
- Internet ingress on `80/tcp` and `443/tcp` forwards to the k3s ingress VIP `10.42.0.20`.
- Unassigned interfaces should still land in `drop` by default.
- Forwarding from the LAN bridge to the WAN interface should stay explicit through a `lanToWan` policy.
