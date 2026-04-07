from __future__ import annotations

import json
import sys
import tarfile
from pathlib import Path


def load_include_files(source_dir: Path) -> list[str]:
    policy = json.loads((source_dir.parent / "bundle-policy.json").read_text())
    return list(policy.get("include", []))


def create_bundle(source_dir: Path, output_path: Path) -> None:
    include_files = load_include_files(source_dir)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(output_path, "w:gz") as archive:
        manifest = {
            "format": "act-portable-v1",
            "included": include_files,
        }
        manifest_bytes = json.dumps(manifest, indent=2).encode("utf-8")
        info = tarfile.TarInfo("manifest.json")
        info.size = len(manifest_bytes)
        archive.addfile(info, fileobj=__import__("io").BytesIO(manifest_bytes))

        for relative_name in include_files:
            archive.add(source_dir / relative_name, arcname=f"state/{relative_name}")


def main(argv: list[str]) -> int:
    if len(argv) != 4 or argv[1] != "create":
        print("usage: act_openclaw_transplant.py create <source-dir> <output>")
        return 2
    create_bundle(Path(argv[2]), Path(argv[3]))
    return 0


raise SystemExit(main(sys.argv))
