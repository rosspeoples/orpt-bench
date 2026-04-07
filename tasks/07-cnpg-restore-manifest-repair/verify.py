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
subprocess.run(["python3", "render-restore.py"], cwd=root, check=True)

request = json.loads((root / "request.json").read_text())
manifest = yaml.safe_load((root / "restore-gitea-postgresql.yaml").read_text())
contract = json.loads((root / "docs" / "s3-secret-contract.json").read_text())
runbook = (root / "docs" / "restore-runbook.md").read_text()

metadata = manifest.get("metadata") or {}
spec = manifest.get("spec") or {}
recovery = ((spec.get("bootstrap") or {}).get("recovery") or {})
backup = recovery.get("backup") or {}
store = (spec.get("backup") or {}).get("barmanObjectStore") or {}
credentials = store.get("s3Credentials") or {}

require(metadata.get("name") == "gitea-postgresql-restore", "restore cluster must use a new cluster name")
require(backup.get("name") == "gitea-postgresql-manual-20260329193828", "restore must reference the expected backup resource")
require(store.get("destinationPath") == "s3://cnpg-backups/gitea-postgresql-restore/", "restore cluster must write to a distinct backup prefix")
require(store.get("endpointURL") == contract["endpointURL"], "wrong S3 endpoint URL")
require("`gitea-postgresql-restore`" in runbook or "gitea-postgresql-restore" in runbook, "runbook must remain the source of truth for restore cluster naming")
require(request["restoreClusterName"] == "gitea-postgresql-restore", "restore request must be corrected before rendering")
require(request["backupName"] == "gitea-postgresql-manual-20260329193828", "restore request must use the runbook backup resource")
require(request["restoreDestinationPath"] == "s3://cnpg-backups/gitea-postgresql-restore/", "restore request must use the restore prefix")

require(credentials.get("accessKeyId", {}).get("name") == contract["secretName"], "expected S3 secret name missing for access key")
require(credentials.get("secretAccessKey", {}).get("name") == contract["secretName"], "expected S3 secret name missing for secret key")
require(credentials.get("region", {}).get("name") == contract["secretName"], "expected S3 secret name missing for region")
require(credentials.get("accessKeyId", {}).get("key") == contract["keys"]["accessKeyId"], "access key secret key must be ACCESS_KEY_ID")
require(credentials.get("secretAccessKey", {}).get("key") == contract["keys"]["secretAccessKey"], "secret access key must be ACCESS_SECRET_KEY")
require(credentials.get("region", {}).get("key") == contract["keys"]["region"], "region key must be AWS_REGION")

print("ok")
