# Task 26: Traefik forwarded header trust repair

Repair a k3s Traefik ingress fixture so real client IPs survive the router path without broadly trusting spoofed headers.

The workspace includes the local proxy-chain notes, a `HelmChartConfig`, and the Traefik service manifest.
The verifier checks trusted IP scope and service traffic-policy semantics.
