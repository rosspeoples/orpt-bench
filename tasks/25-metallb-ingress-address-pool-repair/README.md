# Task 25: MetalLB ingress address pool repair

Repair a MetalLB L2 fixture so the ingress VIP stays on the intended LAN pool and preserves client source IPs.

The workspace includes the local ingress VIP contract, the address pool, the advertisement, and the service manifest.
The verifier checks pool ownership, advertisement linkage, and service semantics.
