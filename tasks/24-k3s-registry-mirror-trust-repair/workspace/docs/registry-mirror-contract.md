# Registry mirror contract

These k3s nodes should mirror all upstream pulls through the local registry over HTTPS.

- The mirror endpoint is `https://registry.thepeoples.dev:5000`.
- Cover `docker.io`, `ghcr.io`, and `quay.io`.
- The endpoint must not include `/v2` because containerd adds the API path itself.
- Trust the local mirror CA at `/etc/rancher/k3s/certs/registry-ca.crt`.
- Do not flip on insecure mode or skip certificate verification.
