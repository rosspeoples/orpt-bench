from __future__ import annotations

import json
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parent


def write_yaml(path: Path, document: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(document, sort_keys=False), encoding="utf-8")


def main() -> int:
    request = json.loads((ROOT / "request.json").read_text())
    slug = request["workspaceSlug"]
    hostname = request["hostname"]
    oidc_group = request["workspaceOidcGroup"]

    catalog = {
        "workspaces": [
            {
                "workspaceSlug": slug,
                "workspaceOidcGroup": oidc_group,
                "hostname": hostname,
                "pattern": request["pattern"],
            }
        ]
    }
    (ROOT / "workspace-catalog.json").write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")

    write_yaml(
        ROOT / "oidc-providers" / f"{slug}.yaml",
        {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {"name": slug},
            "data": {"redirectUri": f"https://{hostname}/oauth2/callback"},
        },
    )

    workspace_dir = ROOT / "platform" / "build" / "workspaces" / slug
    workspace_dir.mkdir(parents=True, exist_ok=True)

    write_yaml(
        workspace_dir / "deployment.yaml",
        {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {"name": slug},
            "spec": {
                "template": {
                    "spec": {
                        "containers": [
                            {
                                "name": "opencode",
                                "image": "ghcr.io/example/opencode:latest",
                                "env": [
                                    {"name": "WORKSPACE_OIDC_GROUP", "value": oidc_group}
                                ],
                            }
                        ]
                    }
                }
            },
        },
    )

    write_yaml(
        workspace_dir / "httproute.yaml",
        {
            "apiVersion": "gateway.networking.k8s.io/v1",
            "kind": "HTTPRoute",
            "metadata": {"name": slug},
            "spec": {"hostnames": [hostname]},
        },
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
