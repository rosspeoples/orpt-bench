from __future__ import annotations

import json
import shutil
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

with tarfile.open(bundle, "r:gz") as archive:
    names = sorted(archive.getnames())

require("manifest.json" in names, "manifest.json missing from bundle")
require("state/agents/session-1.json" in names, "durable agent session missing")
require("state/identity/device.json" in names, "device identity missing")
require("state/identity/device-auth.json" in names, "device auth missing")
require("state/workspace/operator-notes.md" in names, "workspace notes missing")
require("state/logs/runtime.log" not in names, "transient logs must not be bundled")
require("state/tasks/task-1.json" not in names, "task cache must not be bundled")
require("state/devices/paired.json" not in names, "paired devices must not be bundled")
require("state/workspace/.git/config" not in names, "workspace git metadata must not be bundled")

with tarfile.open(bundle, "r:gz") as archive:
    manifest = json.loads(archive.extractfile("manifest.json").read().decode("utf-8"))

require(manifest.get("format") == "act-portable-v1", "wrong manifest format")
require("identity/device.json" in manifest.get("included", []), "manifest included list is wrong")

print("ok")
