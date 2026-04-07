# OpenClaw Durable State Policy

Portable restore bundles may include:

- `agents/session-1.json`
- `identity/device.json`
- `identity/device-auth.json`
- `workspace/operator-notes.md`

Portable restore bundles must exclude transient or host-specific state, including:

- runtime logs
- task caches
- paired-device caches
- workspace git metadata

The generated `manifest.json` should describe exactly the included durable paths.
