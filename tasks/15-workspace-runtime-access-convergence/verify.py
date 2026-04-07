from __future__ import annotations

import json
import subprocess
from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


def load_payload(path: Path, key: str):
    doc = yaml.safe_load(path.read_text())
    return yaml.safe_load(doc["data"][key])


root = Path(__file__).parent / "workspace"
subprocess.run(["python3", "render.py"], cwd=root, check=True)

request = json.loads((root / "request.json").read_text())
request_doc = (root / "docs" / "workspace-request.md").read_text()
design_notes = (root / "docs" / "design-notes.md").read_text()
catalog = json.loads((root / "workspace-catalog.json").read_text())
registry = load_payload(root / "platform" / "build" / "workspace-registry-configmap.yaml", "workspaces-resolved.yaml")
runtime_profiles = {item["slug"]: item for item in load_payload(root / "platform" / "build" / "runtime-profile-catalog-configmap.yaml", "runtime-profiles.yaml")["runtimeProfiles"]}
runtime_access = {item["slug"]: item for item in load_payload(root / "platform" / "build" / "runtime-access-profile-catalog-configmap.yaml", "runtime-access-profiles.yaml")["runtimeAccessProfiles"]}

for value in [request["workspaceSlug"], request["displayName"], request["pattern"], request["template"], request["runtimeProfile"], request["runtimeAccessProfile"], request["repoAccessProfile"], request["hostname"], request["workspaceOidcGroup"]]:
    require(f"`{value}`" in request_doc, f"request JSON value {value!r} must match the human request")

require("platform-gitops" in design_notes, "design notes must remain the source of truth for platform-gitops convergence")

entry = catalog["workspaces"][0]
resolved = registry["workspaces"][0]
require(entry["workspaceSlug"] == "release-engineering", "workspace slug must converge to release-engineering")
require(entry["workspacePatternSlug"] == "platform-ops", "workspace pattern must converge to platform-ops")
require(entry["templateSlug"] == "platform-gitops", "template slug must converge to platform-gitops")
require(entry["runtimeProfile"] == "platform-gitops", "runtime profile must converge to platform-gitops")
require(entry["runtimeAccessProfile"] == "platform-gitops", "runtime access profile must converge to platform-gitops")
require(entry["repoAccessProfile"] == "gitea-write", "repo access profile must converge to gitea-write")
require(entry["hostname"] == "release-engineering.build.ai.thepeoples.dev", "hostname must converge to the build lane")
require(entry["workspaceOidcGroup"] == "thepeoples_dev_build_release_engineering_users", "OIDC group must converge to the requested value")

require(resolved["resolvedPattern"] == "platform-ops", "resolved pattern is wrong")
require(resolved["resolvedTemplate"] == "platform-gitops", "resolved template is wrong")
require(resolved["resolvedRuntimeProfile"] == "platform-gitops", "resolved runtime profile is wrong")
require(resolved["resolvedRuntimeAccessProfile"] == "platform-gitops", "resolved runtime access profile is wrong")
require(resolved["resolvedRepoAccessProfile"] == "gitea-write", "resolved repo access profile is wrong")

runtime_profile = runtime_profiles[entry["runtimeProfile"]]
require(runtime_profile["runtimeAccessProfile"] == "platform-gitops", "runtime profile must require the platform-gitops runtime access profile")

access_profile = runtime_access[entry["runtimeAccessProfile"]]
require(access_profile["projectedServiceAccountToken"] is True, "platform-gitops runtime access must project a service account token")
argocd_rules = access_profile["namespacePermissions"][0]["rules"][0]
require(set(["create", "update", "patch"]).issubset(set(argocd_rules["verbs"])), "platform-gitops runtime access must allow ArgoCD application writes")

deployment = yaml.safe_load((root / "platform" / "build" / "workspaces" / "release-engineering" / "deployment.yaml").read_text())
spec = deployment["spec"]["template"]["spec"]
container = spec["containers"][0]
require(spec["automountServiceAccountToken"] is True, "rendered deployment must project the service account token")
require(container["image"] == "git.thepeoples.dev/platform/agent-platform:latest", "rendered deployment image must use the platform template image")
require(container["env"][0]["value"] == "thepeoples_dev_build_release_engineering_users", "rendered deployment OIDC group env is wrong")
require(container["env"][1]["value"] == "platform-gitops", "rendered deployment guidance profile is wrong")

require(not (root / "platform" / "build" / "workspaces" / "release-eng").exists(), "stale old-slug rendered workspace directory must be removed")

print("ok")
