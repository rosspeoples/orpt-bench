from __future__ import annotations

import configparser
from pathlib import Path
import re
import shlex


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


def iter_active_lines(text: str) -> list[str]:
    lines = []
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("#") and not line.startswith("#include"):
            continue
        lines.append(line)
    return lines


root = Path(__file__).parent / "workspace"
notes = (root / "docs" / "router-dnsmasq-notes.md").read_text()
profile_lines = iter_active_lines((root / "apparmor" / "usr.sbin.dnsmasq").read_text())
local_profile_lines = iter_active_lines((root / "apparmor" / "local" / "usr.sbin.dnsmasq").read_text())
service_parser = configparser.ConfigParser(strict=False)
service_parser.optionxform = str
service_parser.read_string((root / "systemd" / "dnsmasq-router.service").read_text())

require("keep AppArmor in enforce mode" in notes, "router notes missing AppArmor guidance")

profile_line = next((line for line in profile_lines if line.startswith("profile ")), "")
match = re.match(r"profile\s+\S+\s+\S+\s+flags=\(([^)]*)\)\s*\{$", profile_line)
require(match is not None, "main dnsmasq profile must declare flags in the profile header")
flags = {flag.strip() for flag in match.group(1).split(",") if flag.strip()}
require("complain" not in flags, "dnsmasq profile must not be switched to complain mode")
require("#include <local/usr.sbin.dnsmasq>" in profile_lines, "main dnsmasq profile must include the local override")

require(service_parser.has_section("Service"), "dnsmasq systemd unit must define a [Service] section")
exec_start = service_parser.get("Service", "ExecStart", fallback="")
args = shlex.split(exec_start)
require(args[:1] == ["/usr/sbin/dnsmasq"], "service must execute /usr/sbin/dnsmasq directly")
required_args = {
    "--keep-in-foreground",
    "--conf-dir=/srv/router/dnsmasq.d",
    "--addn-hosts=/srv/router/hosts/router.hosts",
    "--dhcp-leasefile=/var/lib/thepeoples/router/dnsmasq.leases",
    "--pid-file=/run/thepeoples/dnsmasq/dnsmasq.pid",
}
require(required_args.issubset(set(args)), "service must keep the expected custom dnsmasq paths")
require(all("unconfined" not in arg for arg in args), "service must not switch dnsmasq to unconfined mode")

required_rules = {
    "/srv/router/dnsmasq.d/** r,",
    "/srv/router/hosts/router.hosts r,",
    "/var/lib/thepeoples/router/dnsmasq.leases rwk,",
    "/run/thepeoples/dnsmasq/dnsmasq.pid rw,",
}
require(required_rules.issubset(set(local_profile_lines)), "local AppArmor override must allow the custom router paths")

deny_rules = [line for line in local_profile_lines if line.startswith("deny ")]
require(
    all(
        "/srv/router/dnsmasq.d" not in rule
        and "/srv/router/hosts/router.hosts" not in rule
        and "/var/lib/thepeoples/router/dnsmasq.leases" not in rule
        and "/run/thepeoples/dnsmasq/dnsmasq.pid" not in rule
        for rule in deny_rules
    ),
    "local AppArmor override must not deny the custom router paths"
)

print("ok")
