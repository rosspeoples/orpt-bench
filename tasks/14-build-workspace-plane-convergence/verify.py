from __future__ import annotations

import json
import subprocess
from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


def load_configmap_payload(path: Path, key: str):
    doc = yaml.safe_load(path.read_text())
    return yaml.safe_load(doc["data"][key])


root = Path(__file__).parent / "workspace"
subprocess.run(["python3", "render.py"], cwd=root, check=True)

request = json.loads((root / "request.json").read_text())
request_doc = (root / "docs" / "workspace-request.md").read_text()
design_notes = (root / "docs" / "design-notes.md").read_text()
catalog = json.loads((root / "workspace-catalog.json").read_text())
registry = load_configmap_payload(root / "platform" / "build" / "workspace-registry-configmap.yaml", "workspaces-resolved.yaml")
registry_creds = load_configmap_payload(root / "platform" / "build" / "mcp-credential-registry-configmap.yaml", "credentials.yaml")

slug = request["workspaceSlug"]
hostname = request["hostname"]
oidc_group = request["workspaceOidcGroup"]

for value in [slug, request["displayName"], request["pattern"], request["budgetPolicy"], request["runtimeProfile"], request["repoAccessProfile"], hostname, oidc_group]:
    require(f"`{value}`" in request_doc, f"request JSON value {value!r} must match the human request")

require("workspace-registry" in design_notes, "design notes must remain the source of truth for resolved registry behavior")
require("thepeoples.dev/ai-build/workspaces/<slug>/mcp/<provider>" in design_notes, "design notes must describe workspace-scoped MCP targets")

entry = catalog["workspaces"][0]
resolved = registry["workspaces"][0]
gitea_cred, argocd_cred = registry_creds["credentials"]

require(entry["workspaceSlug"] == "release-engineering", "workspace slug must match the request")
require(entry["workspacePatternSlug"] == "platform-ops", "workspace pattern must converge to platform-ops")
require(entry["budgetPolicy"] == "standard-interactive", "budget policy must converge to standard-interactive")
require(entry["hostname"] == "release-engineering.build.ai.thepeoples.dev", "hostname must converge to the build lane host")
require(entry["workspaceOidcGroup"] == "thepeoples_dev_build_release_engineering_users", "OIDC group must converge to the requested group")

require(resolved["resolvedPattern"] == "platform-ops", "resolved registry pattern is wrong")
require(resolved["resolvedRuntimeProfile"] == "platform-gitops", "resolved runtime profile is wrong")
require(resolved["resolvedRepoAccessProfile"] == "gitea-write", "resolved repo access profile is wrong")
require(resolved["resolvedBudgetPolicy"] == "standard-interactive", "resolved budget policy is wrong")

require(gitea_cred["target"]["openbaoPath"] == "thepeoples.dev/ai-build/workspaces/release-engineering/mcp/gitea", "gitea MCP target path must be workspace-scoped")
require(argocd_cred["target"]["openbaoPath"] == "thepeoples.dev/ai-build/workspaces/release-engineering/mcp/argocd", "argocd MCP target path must be workspace-scoped")

provider = yaml.safe_load((root / "oidc-providers" / "release-engineering.yaml").read_text())
deployment = yaml.safe_load((root / "platform" / "build" / "workspaces" / "release-engineering" / "deployment.yaml").read_text())
route = yaml.safe_load((root / "platform" / "build" / "workspaces" / "release-engineering" / "httproute.yaml").read_text())
certificate = yaml.safe_load((root / "platform" / "build" / "workspaces" / "release-engineering" / "certificate.yaml").read_text())

require(provider["metadata"]["name"] == "release-engineering", "OIDC provider name must match the converged slug")
require(provider["data"]["redirectUri"] == "https://release-engineering.build.ai.thepeoples.dev/oauth2/callback", "OIDC redirect URI is wrong")
require(deployment["metadata"]["name"] == "release-engineering", "deployment name must match the converged slug")
require(deployment["spec"]["template"]["spec"]["containers"][0]["env"][0]["value"] == "thepeoples_dev_build_release_engineering_users", "deployment OIDC group env is wrong")
require(route["spec"]["hostnames"] == ["release-engineering.build.ai.thepeoples.dev"], "route hostname is wrong")
require(certificate["spec"]["dnsNames"] == ["release-engineering.build.ai.thepeoples.dev"], "certificate dnsNames are wrong")

require(not (root / "oidc-providers" / "release-eng.yaml").exists(), "stale old-slug OIDC provider must be removed")
require(not (root / "platform" / "build" / "workspaces" / "release-eng").exists(), "stale old-slug rendered workspace directory must be removed")

print("ok")
