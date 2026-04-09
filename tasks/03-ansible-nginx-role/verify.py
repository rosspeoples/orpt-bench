from __future__ import annotations

from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
role_root = root / "roles" / "web"

playbook = yaml.safe_load((root / "playbook.yml").read_text())
require(isinstance(playbook, list) and playbook, "playbook must contain at least one play")
play = playbook[0]
require(play.get("hosts") == "all", "playbook must target all hosts")
require(play.get("gather_facts") is False, "playbook must keep gather_facts disabled")
require(play.get("roles") == ["web"], "playbook must include the web role exactly once")
vars_block = play.get("vars") or {}
require(vars_block.get("server_name") == "demo.internal", "playbook must provide server_name=demo.internal")
require(vars_block.get("document_root") == "/srv/demo/current/public", "playbook must provide the expected document_root")

tasks = yaml.safe_load((role_root / "tasks" / "main.yml").read_text())
handlers = yaml.safe_load((role_root / "handlers" / "main.yml").read_text())
template = (role_root / "templates" / "site.conf.j2").read_text()

package_tasks = [task for task in tasks if "package" in task or "apt" in task]
require(package_tasks, "role must install nginx")
require(any(task.get("package", {}).get("name") == "nginx" for task in package_tasks if isinstance(task.get("package"), dict)) or any(task.get("apt", {}).get("name") == "nginx" for task in package_tasks if isinstance(task.get("apt"), dict)), "nginx package must be installed directly")

template_tasks = [task for task in tasks if "template" in task]
require(template_tasks, "template task required")
template_task = template_tasks[0]
require(template_task["template"].get("dest") == "/etc/nginx/sites-available/demo.conf", "template destination incorrect")
notify = template_task.get("notify")
if isinstance(notify, str):
    notify = [notify]
require("reload nginx" in (notify or []), "template must notify reload nginx")

file_tasks = [task for task in tasks if "file" in task]
require(file_tasks, "symlink task required")
require(any(task["file"].get("dest") == "/etc/nginx/sites-enabled/demo.conf" and task["file"].get("src") == "/etc/nginx/sites-available/demo.conf" and task["file"].get("state") == "link" for task in file_tasks), "enabled site symlink missing")

service_tasks = [task for task in tasks if "service" in task]
require(any(task["service"].get("name") == "nginx" and task["service"].get("state") == "started" and task["service"].get("enabled") is True for task in service_tasks), "nginx service must be enabled and started")

require(any(task.get("name") == "reload nginx" and task.get("service", {}).get("state") == "reloaded" for task in handlers), "reload handler missing or wrong")
require("server_name {{ server_name }};" in template, "template must render server_name")
require("root {{ document_root }};" in template, "template must render document_root")

print("ok")
