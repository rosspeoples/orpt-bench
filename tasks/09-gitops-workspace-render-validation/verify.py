from __future__ import annotations

import json
from pathlib import Path


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
catalog = json.loads((root / "workspace-catalog.json").read_text())
provider = (root / "oidc-providers" / "release-engineering.yaml").read_text()
deployment = (root / "platform" / "build" / "workspaces" / "release-engineering" / "deployment.yaml").read_text()
route = (root / "platform" / "build" / "workspaces" / "release-engineering" / "httproute.yaml").read_text()

entry = catalog["workspaces"][0]
require(entry["workspaceSlug"] == "release-engineering", "workspace slug must be release-engineering")
require(entry["workspaceOidcGroup"] == "thepeoples_dev_build_release_engineering_users", "workspaceOidcGroup is wrong")
require(entry["hostname"] == "release-engineering.build.ai.thepeoples.dev", "hostname is wrong")
require("name: release-engineering" in provider, "provider file must match workspace slug")
require("release-engineering.build.ai.thepeoples.dev" in provider, "provider redirect host is wrong")
require("release-engineering" in deployment, "rendered deployment must use the workspace slug")
require("release-engineering.build.ai.thepeoples.dev" in route, "rendered route host is wrong")

print("ok")
