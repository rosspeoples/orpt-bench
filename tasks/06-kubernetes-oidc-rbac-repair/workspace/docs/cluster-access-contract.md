# Cluster Access Contract

- K3s API OIDC issuer: `https://auth.thepeoples.cc/application/o/kubernetes/`
- OIDC client id: `kubernetes`
- Username claim: `preferred_username`
- Groups claim: `groups`
- Username prefix: `oidc:`
- Groups prefix: `oidc:`
- The `agents-cluster-ops` namespace is reserved for `oidc:thepeoples_dev_k8s_cluster_ops_devs`.
- That same cluster-ops group must not be bound in the shared `agents` namespace.
