from __future__ import annotations

import json
import sys
import tarfile
from pathlib import Path


INCLUDE_FILES = [
    "agents/session-1.json",
    "identity/device.json",
    "identity/device-auth.json",
    "logs/runtime.log",
    "workspace/operator-notes.md",
    "workspace/.git/config",
]


def create_bundle(source_dir: Path, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(output_path, "w:gz") as archive:
        manifest = {
            "format": "act-portable-v1",
            "included": INCLUDE_FILES,
        }
        manifest_bytes = json.dumps(manifest, indent=2).encode("utf-8")
        info = tarfile.TarInfo("manifest.json")
        info.size = len(manifest_bytes)
        archive.addfile(info, fileobj=__import__("io").BytesIO(manifest_bytes))

        for relative_name in INCLUDE_FILES:
            archive.add(source_dir / relative_name, arcname=f"state/{relative_name}")


def main(argv: list[str]) -> int:
    if len(argv) != 4 or argv[1] != "create":
        print("usage: act_openclaw_transplant.py create <source-dir> <output>")
        return 2
    create_bundle(Path(argv[2]), Path(argv[3]))
    return 0


raise SystemExit(main(sys.argv))
