# CNPG Manual Restore Runbook

- Never restore over the live `gitea-postgresql` cluster object.
- Manual restore clusters should use the `-restore` suffix.
- Recovery must target the backup object `gitea-postgresql-manual-20260329193828`.
- Restore traffic reads historical data from the shared bucket, but restored clusters must write new backups to their own prefix.
- The restore backup destination is `s3://cnpg-backups/gitea-postgresql-restore/`.
- Object storage endpoint: `https://s3.thepeoples.cc`.
