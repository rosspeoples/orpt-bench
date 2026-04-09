# Task 20: AppArmor dnsmasq profile repair

Repair a dnsmasq confinement issue on the earlier Ubuntu router layout without disabling AppArmor.

The workspace includes the service unit, the main profile, and the local override include.
The verifier checks that the custom config, hosts, lease, and pid-file paths are allowed while enforcement stays enabled.
