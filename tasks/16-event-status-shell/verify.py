from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path


root = Path(__file__).parent / "workspace"
script = root / "bin" / "summarize_events.sh"
fixture = root / "fixtures" / "events.log"

if not os.access(script, os.X_OK):
    print("summarize_events.sh must be executable")
    raise SystemExit(1)

proc = subprocess.run(["bash", str(script), str(fixture)], capture_output=True, text=True, check=True)
data = json.loads(proc.stdout)

expected = {
    "total_events": 5,
    "ok_events": 2,
    "warn_events": 1,
    "fail_events": 2,
}

for key, value in expected.items():
    if data.get(key) != value:
        print(f"expected {key}={value}, got {data.get(key)!r}")
        raise SystemExit(1)

print("ok")
