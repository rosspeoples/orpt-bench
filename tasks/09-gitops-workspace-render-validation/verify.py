from __future__ import annotations

import json
import subprocess
from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
subprocess.run(["python3", "render.py"], cwd=root, check=True)

request = json.loads((root / "request.json").read_text())
catalog = json.loads((root / "workspace-catalog.json").read_text())
request_doc = (root / "docs" / "workspace-request.md").read_text()

slug = request["workspaceSlug"]
hostname = request["hostname"]
oidc_group = request["workspaceOidcGroup"]

require(f"`{slug}`" in request_doc, "request JSON slug must match the human request")
require(f"`{hostname}`" in request_doc, "request JSON hostname must match the human request")
require(f"`{oidc_group}`" in request_doc, "request JSON OIDC group must match the human request")

provider_path = root / "oidc-providers" / f"{slug}.yaml"
workspace_dir = root / "platform" / "build" / "workspaces" / slug
deployment_path = workspace_dir / "deployment.yaml"
route_path = workspace_dir / "httproute.yaml"

require(provider_path.exists(), "provider file must match workspace slug")
require(workspace_dir.is_dir(), "rendered workspace directory must match workspace slug")
require(deployment_path.exists(), "rendered deployment must exist in the slug-matched directory")
require(route_path.exists(), "rendered route must exist in the slug-matched directory")
require(not (root / "oidc-providers" / "release-eng.yaml").exists(), "stale provider file for the old slug must be removed")
require(not (root / "platform" / "build" / "workspaces" / "release-eng").exists(), "stale rendered workspace directory for the old slug must be removed")

provider = yaml.safe_load(provider_path.read_text())
deployment = yaml.safe_load(deployment_path.read_text())
route = yaml.safe_load(route_path.read_text())

entry = catalog["workspaces"][0]
require(entry["workspaceSlug"] == slug, "workspace slug must match the request")
require(entry["workspaceOidcGroup"] == oidc_group, "workspaceOidcGroup is wrong")
require(entry["hostname"] == hostname, "hostname is wrong")

require(provider.get("metadata", {}).get("name") == slug, "provider metadata name must match workspace slug")
require(provider.get("data", {}).get("redirectUri") == f"https://{hostname}/oauth2/callback", "provider redirect host is wrong")
require(deployment.get("metadata", {}).get("name") == slug, "rendered deployment must use the workspace slug")
require((route.get("spec", {}).get("hostnames") or [None])[0] == hostname, "rendered route host is wrong")

print("ok")
