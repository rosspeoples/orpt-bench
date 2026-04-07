from __future__ import annotations

from pathlib import Path


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace" / "roles" / "web"
tasks = (root / "tasks" / "main.yml").read_text()
handlers = (root / "handlers" / "main.yml").read_text()
template = (root / "templates" / "site.conf.j2").read_text()

require("package:" in tasks or "apt:" in tasks, "role must install nginx")
require("name: nginx" in tasks, "nginx package/service must be referenced")
require("template:" in tasks, "template task required")
require("dest: /etc/nginx/sites-available/demo.conf" in tasks, "template destination incorrect")
require("notify:" in tasks and "reload nginx" in tasks, "template must notify reload nginx")
require("file:" in tasks, "symlink task required")
require("/etc/nginx/sites-enabled/demo.conf" in tasks, "enabled site symlink missing")
require("service:" in tasks, "nginx service task required")
require("state: started" in tasks, "nginx service must be started")
require("enabled: true" in tasks, "nginx service must be enabled")
require("name: reload nginx" in handlers, "reload handler missing")
require("state: reloaded" in handlers, "handler must reload nginx")
require("server_name {{ server_name }};" in template, "template must render server_name")
require("root {{ document_root }};" in template, "template must render document_root")

print("ok")
