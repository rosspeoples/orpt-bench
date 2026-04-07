# Task 06: Kubernetes OIDC RBAC repair

Repair a broken Kubernetes OIDC and namespace RBAC fixture so the intended cluster-ops group can work only inside the target namespace.

The workspace includes the local cluster access contract.
The verifier parses the K3s and RBAC YAML to confirm the documented authn/authz intent.
