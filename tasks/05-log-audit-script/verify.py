from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path


root = Path(__file__).parent / "workspace"
script = root / "bin" / "audit_logs.sh"

if not os.access(script, os.X_OK):
    print("audit_logs.sh must be executable")
    raise SystemExit(1)

proc = subprocess.run(["bash", str(script), str(root / "fixtures")], capture_output=True, text=True, check=True)
data = json.loads(proc.stdout)

expected = {
    "total_lines": 8,
    "error_lines": 3,
    "warning_lines": 2,
    "unique_services": 3,
}

for key, value in expected.items():
    if data.get(key) != value:
        print(f"expected {key}={value}, got {data.get(key)!r}")
        raise SystemExit(1)

print("ok")
