from __future__ import annotations

from pathlib import Path


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
k3s_config = (root / "k3s" / "config.yaml").read_text()
rb_agents_cluster_ops = (root / "rbac" / "agents-cluster-ops-rolebinding.yaml").read_text()
rb_agents = (root / "rbac" / "agents-rolebinding.yaml").read_text()

require("kube-apiserver-arg:" in k3s_config, "k3s API server args missing")
require("oidc-issuer-url=https://auth.thepeoples.cc/application/o/kubernetes/" in k3s_config, "wrong OIDC issuer URL")
require("oidc-client-id=kubernetes" in k3s_config, "wrong OIDC client ID")
require("oidc-username-claim=preferred_username" in k3s_config, "wrong username claim")
require("oidc-groups-claim=groups" in k3s_config, "wrong groups claim")
require("oidc-username-prefix=oidc:" in k3s_config, "wrong username prefix")
require("oidc-groups-prefix=oidc:" in k3s_config, "wrong groups prefix")
require("oidc:thepeoples_dev_k8s_cluster_ops_devs" in rb_agents_cluster_ops, "cluster ops RoleBinding must target the expected OIDC group")
require("namespace: agents-cluster-ops" in rb_agents_cluster_ops, "RoleBinding must stay in agents-cluster-ops")
require("oidc:thepeoples_dev_k8s_cluster_ops_devs" not in rb_agents, "cluster ops group must not be bound in the agents namespace")

print("ok")
