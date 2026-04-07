from __future__ import annotations

import subprocess
from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
design = (root / "docs" / "design-notes.md").read_text()
bootstrap_all = yaml.safe_load((root / "automation" / "ansible" / "playbooks" / "bootstrap-all.yml").read_text())
wrapper = (root / "automation" / "scripts" / "bootstrap-all.sh").read_text()

imports = [entry["ansible.builtin.import_playbook"] for entry in bootstrap_all]
expected = [
    "preflight.yml",
    "bootstrap-k3s.yml",
    "bootstrap-base.yml",
    "bootstrap-gitea.yml",
    "seed-gitea-repo.yml",
    "bootstrap-argocd.yml",
]
require(imports == expected, "bootstrap-all playbook must follow the documented phase order")
require("repo must exist in Gitea before ArgoCD bootstrap" in design, "design note must remain authoritative for sequencing")
require(wrapper.index("bootstrap-all.yml") < wrapper.index("bootstrap-openbao.yml"), "OpenBao post-bootstrap configuration must run after the main bootstrap-all playbook")

result = subprocess.run(["bash", "automation/scripts/bootstrap-all.sh"], cwd=root, check=True, capture_output=True, text=True)
lines = [line.strip() for line in result.stdout.splitlines() if line.strip()]
require(lines[0].endswith("automation/ansible/playbooks/bootstrap-all.yml"), "wrapper must run bootstrap-all playbook first")
require(lines[-1].endswith("automation/ansible/playbooks/bootstrap-openbao.yml"), "wrapper must run bootstrap-openbao after bootstrap-all")

print("ok")
