# Ingress VIP contract

Traefik should hold `10.42.0.240` on the LAN via MetalLB L2.

- The reserved ingress pool is `10.42.0.240-10.42.0.249`.
- The pool name is `lan-ingress` in namespace `metallb-system`.
- The L2 advertisement should point only at that pool.
- The Traefik service must stay `LoadBalancer` with `externalTrafficPolicy: Local`.
- Do not use `externalIPs` for this VIP.
