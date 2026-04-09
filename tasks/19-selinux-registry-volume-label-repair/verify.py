from __future__ import annotations

import configparser
from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


def matching_module_specs(tasks: list[dict], *module_names: str) -> list[dict | str]:
    matches: list[dict | str] = []
    for task in tasks:
        for name in module_names:
            if name in task:
                matches.append(task[name])
    return matches


def extract_command(spec: dict | str) -> str | None:
    if isinstance(spec, str):
        return spec
    if not isinstance(spec, dict):
        return None
    return spec.get("cmd") or spec.get("_raw_params")


def contains_string(value: object, needle: str) -> bool:
    if isinstance(value, str):
        return needle in value
    if isinstance(value, dict):
        return any(contains_string(item, needle) for item in value.values())
    if isinstance(value, list):
        return any(contains_string(item, needle) for item in value)
    return False


root = Path(__file__).parent / "workspace"
playbook = yaml.safe_load((root / "automation" / "registry-host.yml").read_text())
tasks = playbook[0]["tasks"]
handoff = (root / "docs" / "registry-node-handoff.md").read_text()
quadlet = configparser.ConfigParser(strict=False)
quadlet.optionxform = str
quadlet.read_string((root / "quadlet" / "registry.container").read_text())

require("SELinux stays enforcing on these nodes" in handoff, "registry handoff note missing")

sefcontexts = matching_module_specs(tasks, "community.general.sefcontext", "sefcontext")
require(sefcontexts, "playbook must declare an SELinux file context rule")
require(
    any(
        isinstance(spec, dict)
        and spec.get("target") == "/srv/registry(/.*)?"
        and spec.get("setype") == "container_file_t"
        and spec.get("state") == "present"
        for spec in sefcontexts
    ),
    "registry data path must be labeled at /srv/registry(/.*)? with container_file_t"
)

commands = matching_module_specs(tasks, "ansible.builtin.command", "command")
require(commands, "playbook must run restorecon for the registry path")
require(
    any(extract_command(spec) == "restorecon -Rv /srv/registry" for spec in commands),
    "playbook must restore labels on /srv/registry"
)

seports = matching_module_specs(tasks, "community.general.seport", "seport")
require(seports, "playbook must label the registry tcp port in SELinux")
require(
    any(
        isinstance(spec, dict)
        and str(spec.get("ports")) == "5000"
        and spec.get("proto") == "tcp"
        and spec.get("setype") == "http_port_t"
        and spec.get("state") == "present"
        for spec in seports
    ),
    "registry port must use http_port_t on tcp/5000"
)

require(quadlet.has_section("Container"), "Quadlet must define a [Container] section")
require(quadlet.get("Container", "Volume", fallback="") == "/srv/registry:/var/lib/registry:Z", "Quadlet volume must relabel the bind mount with :Z")
require(quadlet.get("Container", "PublishPort", fallback="") == "5000:5000", "Quadlet must continue to publish 5000:5000")
require(not quadlet.has_option("Container", "SecurityLabelDisable"), "Quadlet must not disable SELinux labels")

require(not contains_string(playbook, "setenforce 0"), "playbook must not disable SELinux")
require(not contains_string(playbook, "SELINUX=disabled"), "playbook must not disable SELinux")

print("ok")
