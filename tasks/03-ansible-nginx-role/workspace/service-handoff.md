# Demo Service Handoff

- Package manager should install `nginx` directly.
- The site config must render to `/etc/nginx/sites-available/demo.conf`.
- `/etc/nginx/sites-enabled/demo.conf` should be a symlink to the rendered file.
- The vhost is templated and must use `server_name` and `document_root` variables.
- `nginx` should be enabled and started.
- Config changes should notify a `reload nginx` handler, not a restart.
