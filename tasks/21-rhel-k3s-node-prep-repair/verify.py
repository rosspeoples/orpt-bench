from __future__ import annotations

from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
notes = (root / "docs" / "rhel-k3s-bootstrap-notes.md").read_text()
playbook = yaml.safe_load((root / "automation" / "prepare-k3s-node.yml").read_text())
tasks = playbook[0]["tasks"]
k3s = yaml.safe_load((root / "k3s" / "config.yaml").read_text())

require("use the RHEL-native firewalld and SELinux path" in notes, "bootstrap notes missing RHEL guidance")

package_specs = []
for task in tasks:
    spec = task.get("ansible.builtin.package") or task.get("package")
    if spec:
        package_specs.append(spec)
require(package_specs, "node prep must install the required RHEL packages")
package_names = set()
for spec in package_specs:
    if spec.get("state") not in (None, "present", "latest"):
        continue
    names = spec.get("name") or []
    if isinstance(names, str):
        names = [names]
    package_names.update(names)
require({"container-selinux", "k3s-selinux"}.issubset(package_names), "node prep must install container-selinux and k3s-selinux")

modprobe_specs = []
for task in tasks:
    spec = task.get("community.general.modprobe") or task.get("modprobe")
    if spec:
        modprobe_specs.append(spec)
modprobe_names = {spec.get("name") for spec in modprobe_specs if spec.get("state") == "present"}
require({"overlay", "br_netfilter"}.issubset(modprobe_names), "node prep must load overlay and br_netfilter")

sysctls = {}
for task in tasks:
    spec = task.get("ansible.posix.sysctl") or task.get("sysctl")
    if spec:
        sysctls[spec.get("name")] = spec.get("value")
require(sysctls.get("net.ipv4.ip_forward") == "1", "node prep must enable net.ipv4.ip_forward")
require(sysctls.get("net.bridge.bridge-nf-call-iptables") == "1", "node prep must enable bridge-nf-call-iptables")

firewalld_specs = []
for task in tasks:
    spec = task.get("ansible.posix.firewalld") or task.get("firewalld")
    if spec:
        firewalld_specs.append(spec)
ports = {spec.get("port") for spec in firewalld_specs if spec.get("state") == "enabled"}
required_ports = {"6443/tcp", "8472/udp", "10250/tcp", "30000-32767/tcp"}
require(required_ports.issubset(ports), "node prep must open the documented k3s and NodePort firewalld ports")
require(all(spec.get("permanent") is True and spec.get("immediate") is True for spec in firewalld_specs), "firewalld changes must be both permanent and immediate")
require(all(spec.get("state") == "enabled" for spec in firewalld_specs), "firewalld rules must stay enabled")

require(k3s.get("selinux") is True, "k3s config must enable selinux mode")
require(k3s.get("flannel-backend") == "vxlan", "k3s config must stay on the documented vxlan backend during bootstrap")
require(k3s.get("write-kubeconfig-mode") == "0640", "k3s config must keep kubeconfig mode at 0640")

print("ok")
