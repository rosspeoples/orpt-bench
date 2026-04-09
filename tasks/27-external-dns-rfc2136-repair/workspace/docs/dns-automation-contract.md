# DNS automation contract

ExternalDNS talks RFC2136 back to the router authority.

- The router DNS authority lives at `10.42.0.1:53`.
- The managed zone is `thepeoples.dev`.
- Sources remain `service` and `ingress`.
- Use TXT ownership with owner ID `thepeoples-dev-k3s`.
- TSIG key name is `externaldns.` and the algorithm is `hmac-sha256`.
- The TSIG shared secret comes from the Kubernetes secret `external-dns-rfc2136-tsig` key `tsig-secret`.
