from __future__ import annotations

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
provider_catalog = load_configmap_payload(root / "platform" / "build" / "mcp-provider-catalog-configmap.yaml", "mcp-providers.yaml")
workspace_catalog = load_configmap_payload(root / "platform" / "build" / "workspace-catalog-configmap.yaml", "workspaces.yaml")
registry = load_configmap_payload(root / "platform" / "build" / "mcp-credential-registry-configmap.yaml", "credentials.yaml")
gitea_plugin = (root / "platform" / "build" / "opencode" / "plugins" / "gitea-mcp.js").read_text()
argocd_plugin = (root / "platform" / "build" / "opencode" / "plugins" / "argocd-mcp.js").read_text()

providers = {item["slug"]: item for item in provider_catalog["mcpProviders"]}
workspace = workspace_catalog["workspaces"][0]
credentials = {item["provider"]: item for item in registry["credentials"]}
workspace_slug = workspace["workspaceSlug"]

gitea = providers["gitea"]
argocd = providers["argocd"]

require(gitea["secretKey"] == "GITEA_TOKEN", "Gitea provider secret key must be GITEA_TOKEN")
require(gitea["secretRemotePathSuffix"] == "mcp/gitea", "Gitea remote path suffix must be mcp/gitea")
require(argocd["secretKey"] == "ARGOCD_AUTH_TOKEN", "ArgoCD provider secret key must be ARGOCD_AUTH_TOKEN")
require(argocd["secretRemotePathSuffix"] == "mcp/argocd", "ArgoCD remote path suffix must be mcp/argocd")

gitea_cred = credentials["gitea"]
argocd_cred = credentials["argocd"]
require(gitea_cred["sourceType"] == "external-bootstrap", "Gitea should use external-bootstrap source type")
require(gitea_cred["target"]["openbaoPath"] == f"thepeoples.dev/ai-build/workspaces/{workspace_slug}/mcp/gitea", "Gitea target path must be workspace-scoped")
require(argocd_cred["sourceType"] == "generated-account-token", "ArgoCD should use generated-account-token source type")
require(argocd_cred["target"]["openbaoPath"] == f"thepeoples.dev/ai-build/workspaces/{workspace_slug}/mcp/argocd", "ArgoCD target path must be workspace-scoped")

require("GITEA_TOKEN: \"{env:GITEA_TOKEN}\"" in gitea_plugin, "Gitea plugin env contract must match provider secret key")
require("ARGOCD_AUTH_TOKEN: \"{env:ARGOCD_AUTH_TOKEN}\"" in argocd_plugin, "ArgoCD plugin env contract must match provider secret key")

gitea_access = workspace["mcpAccess"]["gitea"]
argocd_access = workspace["mcpAccess"]["argocd"]
require(gitea_cred.get("allowedRepos") == gitea_access.get("allowedRepos"), "Gitea allowedRepos must match workspace mcpAccess")
require(argocd_cred.get("allowedApplications") == argocd_access.get("allowedApplications"), "ArgoCD allowedApplications must match workspace mcpAccess")

print("ok")
