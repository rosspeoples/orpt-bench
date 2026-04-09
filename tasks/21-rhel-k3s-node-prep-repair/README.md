# Task 21: RHEL k3s node preparation repair

Repair a broken RHEL-family k3s node-prep fixture so the host prerequisites match the documented bootstrap contract.

The workspace includes the local bootstrap notes, a node-prep playbook, and a k3s config file.
The verifier checks the package, kernel, sysctl, firewalld, and k3s SELinux intent semantically.
