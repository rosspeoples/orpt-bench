#!/usr/bin/env bash

set -euo pipefail

echo "running OpenBao post-bootstrap configuration"
bash automation/scripts/ansible-playbook.sh automation/ansible/playbooks/bootstrap-openbao.yml

echo "running full bootstrap through ansible"
bash automation/scripts/ansible-playbook.sh automation/ansible/playbooks/bootstrap-all.yml
