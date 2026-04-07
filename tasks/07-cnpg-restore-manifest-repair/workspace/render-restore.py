from __future__ import annotations

import json
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parent


def main() -> int:
    request = json.loads((ROOT / "request.json").read_text())
    contract = json.loads((ROOT / "docs" / "s3-secret-contract.json").read_text())

    manifest = {
        "apiVersion": "postgresql.cnpg.io/v1",
        "kind": "Cluster",
        "metadata": {
            "name": request["restoreClusterName"],
            "namespace": "gitea",
        },
        "spec": {
            "instances": 1,
            "imageName": "ghcr.io/cloudnative-pg/postgresql:16",
            "storage": {
                "size": "20Gi",
                "storageClass": "ceph-rbd",
            },
            "superuserSecret": {"name": "gitea-postgresql-auth"},
            "bootstrap": {
                "recovery": {
                    "backup": {"name": request["backupName"]},
                    "database": "gitea",
                    "owner": "gitea",
                    "secret": {"name": "gitea-postgresql-auth"},
                }
            },
            "backup": {
                "target": "prefer-standby",
                "retentionPolicy": "7d",
                "barmanObjectStore": {
                    "destinationPath": request["restoreDestinationPath"],
                    "endpointURL": contract["endpointURL"],
                    "s3Credentials": {
                        "accessKeyId": {
                            "name": contract["secretName"],
                            "key": contract["keys"]["accessKeyId"],
                        },
                        "secretAccessKey": {
                            "name": contract["secretName"],
                            "key": contract["keys"]["secretAccessKey"],
                        },
                        "region": {
                            "name": contract["secretName"],
                            "key": contract["keys"]["region"],
                        },
                    },
                    "data": {"compression": "gzip"},
                    "wal": {"compression": "gzip"},
                },
            },
        },
    }

    (ROOT / "restore-gitea-postgresql.yaml").write_text(yaml.safe_dump(manifest, sort_keys=False), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
