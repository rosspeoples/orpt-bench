#!/usr/bin/env bash

set -euo pipefail

phase="${1:-}"
[[ -n "${phase}" ]] || { echo "usage: validate-phase.sh <base|cnpg|gitea|seed-gitea|argocd>"; exit 1; }

case "${phase}" in
  base)
    playbook="automation/ansible/playbooks/validate-base.yml"
    ;;
  cnpg)
    playbook="automation/ansible/playbooks/validate-cnpg.yml"
    ;;
  gitea)
    playbook="automation/ansible/playbooks/validate-seed-gitea.yml"
    ;;
  seed-gitea)
    playbook="automation/ansible/playbooks/validate-seed-gitea.yml"
    ;;
  argocd)
    playbook="automation/ansible/playbooks/validate-argocd.yml"
    ;;
  *)
    echo "unknown validation phase: ${phase}"
    exit 1
    ;;
esac

printf '%s\n' "${playbook}"
