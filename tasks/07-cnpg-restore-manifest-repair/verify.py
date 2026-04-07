from __future__ import annotations

from pathlib import Path


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


manifest = (Path(__file__).parent / "workspace" / "restore-gitea-postgresql.yaml").read_text()

require("name: gitea-postgresql-restore" in manifest, "restore cluster must use a new cluster name")
require("name: gitea-postgresql-manual-20260329193828" in manifest, "restore must reference the expected backup resource")
require("destinationPath: s3://cnpg-backups/gitea-postgresql-restore/" in manifest, "restore cluster must write to a distinct backup prefix")
require("name: cnpg-backups-s3" in manifest, "expected S3 secret name missing")
require("key: ACCESS_KEY_ID" in manifest, "access key secret key must be ACCESS_KEY_ID")
require("key: ACCESS_SECRET_KEY" in manifest, "secret access key must be ACCESS_SECRET_KEY")
require("key: AWS_REGION" in manifest, "region key must be AWS_REGION")
require("endpointURL: https://s3.thepeoples.cc" in manifest, "wrong S3 endpoint URL")
require("name: gitea-postgresql" not in manifest.split("metadata:", 1)[1].split("spec:", 1)[0], "manifest metadata must not reuse the live cluster name")

print("ok")
