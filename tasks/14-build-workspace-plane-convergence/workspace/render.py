from __future__ import annotations

import json
from pathlib import Path
import shutil

import yaml


ROOT = Path(__file__).resolve().parent


def load_configmap_payload(path: Path, key: str):
    doc = yaml.safe_load(path.read_text())
    return yaml.safe_load(doc["data"][key])


def write_yaml(path: Path, document: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(document, sort_keys=False), encoding="utf-8")


def main() -> int:
    request = json.loads((ROOT / "request.json").read_text())
    patterns = {item["slug"]: item for item in load_configmap_payload(ROOT / "platform" / "build" / "workspace-pattern-catalog-configmap.yaml", "workspace-patterns.yaml")["workspacePatterns"]}
    runtime_profiles = {item["slug"]: item for item in load_configmap_payload(ROOT / "platform" / "build" / "runtime-profile-catalog-configmap.yaml", "runtime-profiles.yaml")["runtimeProfiles"]}
    repo_profiles = {item["slug"]: item for item in load_configmap_payload(ROOT / "platform" / "build" / "repo-access-profile-catalog-configmap.yaml", "repo-access-profiles.yaml")["repoAccessProfiles"]}
    budget_policies = {item["slug"]: item for item in load_configmap_payload(ROOT / "platform" / "build" / "budget-policy-catalog-configmap.yaml", "budget-policies.yaml")["budgetPolicies"]}

    slug = request["workspaceSlug"]
    stale_slug = "release-eng"

    # Remove stale old-slug outputs before writing the converged workspace.
    (ROOT / "oidc-providers" / f"{stale_slug}.yaml").unlink(missing_ok=True)
    shutil.rmtree(ROOT / "platform" / "build" / "workspaces" / stale_slug, ignore_errors=True)

    pattern = patterns[request["pattern"]]
    runtime_profile = runtime_profiles[request["runtimeProfile"]]
    repo_profile = repo_profiles[request["repoAccessProfile"]]
    budget = budget_policies[request["budgetPolicy"]]

    if request["repoAccessProfile"] not in runtime_profile["allowedRepoAccessProfiles"]:
        raise SystemExit("repoAccessProfile not allowed for runtime profile")

    workspace_catalog = {
        "workspaces": [
            {
                "workspaceSlug": slug,
                "displayName": request["displayName"],
                "workspacePatternSlug": request["pattern"],
                "workspaceOidcGroup": request["workspaceOidcGroup"],
                "hostname": request["hostname"],
                "budgetPolicy": budget["slug"],
                "mcpAccess": {
                    "gitea": {
                        "enabled": True,
                        "accessMode": "read_only",
                        "allowedRepos": request["allowedRepos"],
                    },
                    "argocd": {
                        "enabled": True,
                        "accessMode": "read_only",
                        "allowedApplications": request["allowedApplications"],
                    },
                },
            }
        ]
    }
    (ROOT / "workspace-catalog.json").write_text(json.dumps(workspace_catalog, indent=2) + "\n", encoding="utf-8")

    registry = {
        "version": "v1",
        "workspaces": [
            {
                "workspaceSlug": slug,
                "displayName": request["displayName"],
                "resolvedPattern": pattern["slug"],
                "resolvedRuntimeProfile": runtime_profile["slug"],
                "resolvedRepoAccessProfile": repo_profile["slug"],
                "resolvedBudgetPolicy": budget["slug"],
                "hostname": request["hostname"],
            }
        ],
    }
    write_yaml(ROOT / "platform" / "build" / "workspace-registry-configmap.yaml", {
        "apiVersion": "v1",
        "kind": "ConfigMap",
        "metadata": {"name": "build-workspace-registry", "namespace": "ai-build"},
        "data": {"workspaces-resolved.yaml": yaml.safe_dump(registry, sort_keys=False)},
    })

    write_yaml(ROOT / "oidc-providers" / f"{slug}.yaml", {
        "apiVersion": "v1",
        "kind": "ConfigMap",
        "metadata": {"name": slug},
        "data": {"redirectUri": f"https://{request['hostname']}/oauth2/callback"},
    })

    write_yaml(ROOT / "platform" / "build" / "mcp-credential-registry-configmap.yaml", {
        "apiVersion": "v1",
        "kind": "ConfigMap",
        "metadata": {"name": "build-mcp-credential-registry", "namespace": "ai-build"},
        "data": {
            "credentials.yaml": yaml.safe_dump({
                "version": "v1",
                "credentials": [
                    {
                        "name": f"{slug}-gitea-mcp",
                        "enabled": True,
                        "workspace": slug,
                        "provider": "gitea",
                        "sourceType": "external-bootstrap",
                        "target": {"openbaoPath": f"thepeoples.dev/ai-build/workspaces/{slug}/mcp/gitea", "property": "token"},
                        "allowedRepos": request["allowedRepos"],
                    },
                    {
                        "name": f"{slug}-argocd-mcp",
                        "enabled": True,
                        "workspace": slug,
                        "provider": "argocd",
                        "sourceType": "generated-account-token",
                        "target": {"openbaoPath": f"thepeoples.dev/ai-build/workspaces/{slug}/mcp/argocd", "property": "token"},
                        "allowedApplications": request["allowedApplications"],
                    },
                ],
            }, sort_keys=False)
        },
    })

    workspace_dir = ROOT / "platform" / "build" / "workspaces" / slug
    workspace_dir.mkdir(parents=True, exist_ok=True)
    write_yaml(workspace_dir / "deployment.yaml", {
        "apiVersion": "apps/v1",
        "kind": "Deployment",
        "metadata": {"name": slug},
        "spec": {"template": {"spec": {"containers": [{"name": "opencode", "env": [{"name": "WORKSPACE_OIDC_GROUP", "value": request["workspaceOidcGroup"]}]}]}}},
    })
    write_yaml(workspace_dir / "httproute.yaml", {
        "apiVersion": "gateway.networking.k8s.io/v1",
        "kind": "HTTPRoute",
        "metadata": {"name": slug},
        "spec": {"hostnames": [request["hostname"]]},
    })
    write_yaml(workspace_dir / "certificate.yaml", {
        "apiVersion": "cert-manager.io/v1",
        "kind": "Certificate",
        "metadata": {"name": f"{slug}-tls"},
        "spec": {"secretName": f"{slug}-tls", "dnsNames": [request["hostname"]]},
    })

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
