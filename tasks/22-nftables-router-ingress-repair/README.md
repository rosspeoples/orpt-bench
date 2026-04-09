# Task 22: nftables router ingress repair

Repair an nftables-based router ruleset that was left in an unsafe and incomplete state during the earlier edge-router bring-up.

The workspace includes the local runbook and the checked-in `nftables` ruleset.
The verifier checks filter defaults, forwarding semantics, DNAT, source NAT, and MSS clamping intent.
