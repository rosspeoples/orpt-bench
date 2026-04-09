# Registry node handoff

The local image mirror for k3s runs on a RHEL-family node using Quadlet.

- SELinux stays enforcing on these nodes.
- Registry data lives on `/srv/registry` and must be labeled for container access.
- The bind mount should stay confined rather than disabling SELinux labeling.
- The registry listens on `5000/tcp`, so that port needs the normal HTTP SELinux type.
- Apply the file-context rule and restore the labels after defining it.
