from __future__ import annotations

from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
k3s = yaml.safe_load((root / "k3s" / "config.yaml").read_text())
rb_agents_cluster_ops = yaml.safe_load((root / "rbac" / "agents-cluster-ops-rolebinding.yaml").read_text())
rb_agents = yaml.safe_load((root / "rbac" / "agents-rolebinding.yaml").read_text())

api_args = set(k3s.get("kube-apiserver-arg") or [])
expected_args = {
    "oidc-issuer-url=https://auth.thepeoples.cc/application/o/kubernetes/",
    "oidc-client-id=kubernetes",
    "oidc-username-claim=preferred_username",
    "oidc-groups-claim=groups",
    "oidc-username-prefix=oidc:",
    "oidc-groups-prefix=oidc:",
}
require(expected_args.issubset(api_args), "k3s OIDC args do not match the cluster access contract")

cluster_ops_subjects = rb_agents_cluster_ops.get("subjects") or []
require(rb_agents_cluster_ops.get("metadata", {}).get("namespace") == "agents-cluster-ops", "RoleBinding must stay in agents-cluster-ops")
require(any(subject.get("kind") == "Group" and subject.get("name") == "oidc:thepeoples_dev_k8s_cluster_ops_devs" for subject in cluster_ops_subjects), "cluster ops RoleBinding must target the expected OIDC group")

shared_subjects = rb_agents.get("subjects") or []
require(all(subject.get("name") != "oidc:thepeoples_dev_k8s_cluster_ops_devs" for subject in shared_subjects), "cluster ops group must not be bound in the agents namespace")

print("ok")
