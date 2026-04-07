from __future__ import annotations

from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
notes = (root / "docs" / "routing-notes.md").read_text()
build_cert = yaml.safe_load((root / "platform" / "build" / "build-portal-certificate.yaml").read_text())
build_route = yaml.safe_load((root / "platform" / "build" / "build-portal-httproute.yaml").read_text())
workspace_cert = yaml.safe_load((root / "platform" / "build" / "workspaces" / "release-engineering" / "certificate.yaml").read_text())
workspace_route = yaml.safe_load((root / "platform" / "build" / "workspaces" / "release-engineering" / "httproute.yaml").read_text())
kustomization = yaml.safe_load((root / "platform" / "build" / "kustomization.yaml").read_text())

build_dns = build_cert.get("spec", {}).get("dnsNames") or []
require("build.ai.thepeoples.dev" in build_dns, "build cert must cover the build portal apex host")
require("*.build.ai.thepeoples.dev" in build_dns, "build cert must cover the build lane wildcard host space")
require((build_route.get("spec", {}).get("hostnames") or [None])[0] == "build.ai.thepeoples.dev", "build portal route hostname must stay on build.ai.thepeoples.dev")

workspace_host = (workspace_route.get("spec", {}).get("hostnames") or [None])[0]
workspace_dns = workspace_cert.get("spec", {}).get("dnsNames") or []
require(workspace_host == "release-engineering.build.ai.thepeoples.dev", "workspace route hostname must stay under the build lane")
require(workspace_dns == [workspace_host], "workspace certificate dnsNames must match the workspace route hostname")

resources = kustomization.get("resources") or []
require("build-portal-httproute.yaml" in resources, "build kustomization must include the build portal route")
require("build-portal-certificate.yaml" in resources, "build kustomization must include the build portal certificate")
require("*.build.ai.thepeoples.dev" in notes, "routing notes must remain the source of truth for wildcard coverage")

print("ok")
