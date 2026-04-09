from __future__ import annotations

from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
notes = (root / "docs" / "registry-mirror-contract.md").read_text()
registries = yaml.safe_load((root / "k3s" / "registries.yaml").read_text())

require("mirror all upstream pulls through the local registry over HTTPS" in notes, "registry mirror contract missing")

mirrors = registries.get("mirrors") or {}
require(set(mirrors) == {"docker.io", "ghcr.io", "quay.io"}, "registries.yaml must define mirrors only for docker.io, ghcr.io, and quay.io")
expected_endpoint = "https://registry.thepeoples.dev:5000"
for upstream in ("docker.io", "ghcr.io", "quay.io"):
    mirror = mirrors.get(upstream) or {}
    endpoints = mirror.get("endpoint") or []
    require(endpoints == [expected_endpoint], f"{upstream} must point only to {expected_endpoint}")
    require(all("/v2" not in endpoint for endpoint in endpoints), f"{upstream} endpoint must not include /v2")
    require(all(endpoint.startswith("https://") for endpoint in endpoints), f"{upstream} endpoint must stay on HTTPS")

configs = registries.get("configs") or {}
require(set(configs) == {"registry.thepeoples.dev:5000"}, "registries.yaml must define TLS config only for registry.thepeoples.dev:5000")
registry_cfg = configs.get("registry.thepeoples.dev:5000") or {}
tls = registry_cfg.get("tls") or {}
require(tls.get("ca_file") == "/etc/rancher/k3s/certs/registry-ca.crt", "registry mirror must trust the checked-in CA path")
require(tls.get("insecure_skip_verify") in (None, False), "registry mirror must not skip TLS verification")
require(not registry_cfg.get("auth"), "registry mirror fixture must not depend on auth entries")

print("ok")
