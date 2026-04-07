#!/usr/bin/env bash

set -euo pipefail

python3 - <<'PY'
import yaml
from pathlib import Path

playbook = yaml.safe_load(Path('automation/ansible/playbooks/preflight.yml').read_text())
assertions = playbook[0]['tasks'][0]['ansible.builtin.assert']['that']
expected = {
    "lookup('env', 'CLUSTER_SSH_HOST') | length > 0",
    "lookup('env', 'CLUSTER_SSH_USER') | length > 0",
    "lookup('env', 'CLUSTER_ADMIN_USER') | length > 0",
    "lookup('env', 'CLUSTER_HOSTNAME') | length > 0",
    "lookup('env', 'KUBECONFIG_OUT') | length > 0",
}
missing = sorted(expected - set(assertions))
if missing:
    raise SystemExit('missing preflight assertions: ' + ', '.join(missing))
print('preflight checks passed')
PY
