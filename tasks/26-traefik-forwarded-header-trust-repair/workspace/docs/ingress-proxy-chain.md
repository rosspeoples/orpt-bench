# Ingress proxy chain notes

The edge router DNATs `80/tcp` and `443/tcp` to the Traefik LoadBalancer IP.

- Preserve real client source IPs through the service path.
- Trust forwarded headers only from the edge router and loopback.
- Do not switch Traefik into an insecure trust-all mode.
- Keep the configuration in the checked-in k3s `HelmChartConfig`.
