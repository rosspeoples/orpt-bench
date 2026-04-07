from __future__ import annotations

import json
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parent


def load_payload(path: Path, key: str):
    doc = yaml.safe_load(path.read_text())
    return yaml.safe_load(doc["data"][key])


def write_yaml(path: Path, document: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(document, sort_keys=False), encoding="utf-8")


def main() -> int:
    request = json.loads((ROOT / "request.json").read_text())
    patterns = {item["slug"]: item for item in load_payload(ROOT / "platform" / "build" / "workspace-pattern-catalog-configmap.yaml", "workspace-patterns.yaml")["workspacePatterns"]}
    templates = {item["slug"]: item for item in load_payload(ROOT / "platform" / "build" / "workspace-template-catalog-configmap.yaml", "templates.yaml")["templates"]}
    runtime_profiles = {item["slug"]: item for item in load_payload(ROOT / "platform" / "build" / "runtime-profile-catalog-configmap.yaml", "runtime-profiles.yaml")["runtimeProfiles"]}
    runtime_access = {item["slug"]: item for item in load_payload(ROOT / "platform" / "build" / "runtime-access-profile-catalog-configmap.yaml", "runtime-access-profiles.yaml")["runtimeAccessProfiles"]}

    slug = request["workspaceSlug"]
    pattern = patterns[request["pattern"]]
    template = templates[request["template"]]
    runtime_profile = runtime_profiles[request["runtimeProfile"]]
    runtime_access_profile = runtime_access[request["runtimeAccessProfile"]]

    registry = {
        "version": "v1",
        "workspaces": [
            {
                "workspaceSlug": slug,
                "displayName": request["displayName"],
                "resolvedPattern": pattern["slug"],
                "resolvedTemplate": template["slug"],
                "resolvedRuntimeProfile": runtime_profile["slug"],
                "resolvedRuntimeAccessProfile": runtime_access_profile["slug"],
                "resolvedRepoAccessProfile": request["repoAccessProfile"],
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

    workspace_dir = ROOT / "platform" / "build" / "workspaces" / slug
    workspace_dir.mkdir(parents=True, exist_ok=True)
    write_yaml(workspace_dir / "deployment.yaml", {
        "apiVersion": "apps/v1",
        "kind": "Deployment",
        "metadata": {"name": slug},
        "spec": {
            "template": {
                "spec": {
                    "automountServiceAccountToken": runtime_access_profile["projectedServiceAccountToken"],
                    "containers": [
                        {
                            "name": "opencode",
                            "image": template["image"],
                            "env": [
                                {"name": "WORKSPACE_OIDC_GROUP", "value": request["workspaceOidcGroup"]},
                                {"name": "GUIDANCE_PROFILE", "value": template["guidanceProfile"]},
                            ],
                        }
                    ],
                }
            }
        },
    })

    write_yaml(ROOT / "workspace-catalog.json", {
        "workspaces": [
            {
                "workspaceSlug": slug,
                "displayName": request["displayName"],
                "workspacePatternSlug": request["pattern"],
                "hostname": request["hostname"],
                "workspaceOidcGroup": request["workspaceOidcGroup"],
                "templateSlug": request["template"],
                "runtimeProfile": request["runtimeProfile"],
                "runtimeAccessProfile": request["runtimeAccessProfile"],
                "repoAccessProfile": request["repoAccessProfile"],
            }
        ]
    })
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
