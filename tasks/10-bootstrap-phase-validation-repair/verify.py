from __future__ import annotations

import subprocess
from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"

preflight = yaml.safe_load((root / "automation" / "ansible" / "playbooks" / "preflight.yml").read_text())
preflight_assertions = preflight[0]["tasks"][0]["ansible.builtin.assert"]["that"]
expected_preflight = {
    "lookup('env', 'CLUSTER_SSH_HOST') | length > 0",
    "lookup('env', 'CLUSTER_SSH_USER') | length > 0",
    "lookup('env', 'CLUSTER_ADMIN_USER') | length > 0",
    "lookup('env', 'CLUSTER_HOSTNAME') | length > 0",
    "lookup('env', 'KUBECONFIG_OUT') | length > 0",
}
require(expected_preflight.issubset(set(preflight_assertions)), "preflight must assert the day-0 bootstrap environment variables")

validate_gitea = yaml.safe_load((root / "automation" / "ansible" / "playbooks" / "validate-gitea.yml").read_text())
gitea_assertions = validate_gitea[0]["tasks"][0]["ansible.builtin.assert"]["that"]
require(any("OIDC_ISSUER_URL_GITEA" in assertion for assertion in gitea_assertions), "validate-gitea must accept the Gitea-specific OIDC issuer variable")

storage_assertions = validate_gitea[0]["tasks"][1]["ansible.builtin.assert"]["that"]
require(all("rbd.csi.ceph.com" in assertion for assertion in storage_assertions), "validate-gitea must require Ceph RBD-backed storage classes")

phase_script = (root / "automation" / "scripts" / "validate-phase.sh").read_text()
require('gitea)' in phase_script and 'validate-gitea.yml' in phase_script, "validate-phase.sh must route gitea to validate-gitea.yml")
require('seed-gitea)' in phase_script and 'validate-seed-gitea.yml' in phase_script, "validate-phase.sh must route seed-gitea to validate-seed-gitea.yml")

makefile = (root / "Makefile").read_text()
require('validate-gitea:\n\tbash automation/scripts/validate-phase.sh gitea' in makefile, "make validate-gitea must call the gitea validation phase")

subprocess.run(["bash", "automation/scripts/preflight.sh"], cwd=root, check=True, capture_output=True, text=True)
result = subprocess.run(["bash", "automation/scripts/validate-phase.sh", "gitea"], cwd=root, check=True, capture_output=True, text=True)
require(result.stdout.strip() == 'automation/ansible/playbooks/validate-gitea.yml', "gitea validation phase should resolve to validate-gitea.yml")

print("ok")
