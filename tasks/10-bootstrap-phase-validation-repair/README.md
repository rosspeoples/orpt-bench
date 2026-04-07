# Task 10: Bootstrap phase validation repair

Repair a broken pre-ArgoCD bootstrap validation flow so preflight and phase-specific validation match the intended operational contract.

The workspace includes a design note, a make entrypoint, shell wrapper, and Ansible playbooks.
The verifier runs the local validation script and checks that the right contract is enforced.
