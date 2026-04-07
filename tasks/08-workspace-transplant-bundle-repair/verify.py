from __future__ import annotations

import json
import subprocess
import tarfile
from pathlib import Path


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
bundle = root / "portable.tar.gz"
if bundle.exists():
    bundle.unlink()

subprocess.run([
    "python3",
    "scripts/act_openclaw_transplant.py",
    "create",
    str(root / "fixture-openclaw"),
    str(bundle),
], cwd=root, check=True)

require(bundle.exists(), "portable bundle was not created")

expected_included = {
    "agents/session-1.json",
    "identity/device.json",
    "identity/device-auth.json",
    "workspace/operator-notes.md",
}
expected_bundle_paths = {f"state/{path}" for path in expected_included}

with tarfile.open(bundle, "r:gz") as archive:
    names = set(archive.getnames())
    manifest = json.loads(archive.extractfile("manifest.json").read().decode("utf-8"))

require("manifest.json" in names, "manifest.json missing from bundle")
require(expected_bundle_paths.issubset(names), "durable state entries missing from bundle")
require("state/logs/runtime.log" not in names, "transient logs must not be bundled")
require("state/tasks/task-1.json" not in names, "task cache must not be bundled")
require("state/devices/paired.json" not in names, "paired devices must not be bundled")
require("state/workspace/.git/config" not in names, "workspace git metadata must not be bundled")

require(manifest.get("format") == "act-portable-v1", "wrong manifest format")
require(set(manifest.get("included", [])) == expected_included, "manifest included list must match durable-state policy exactly")

print("ok")
