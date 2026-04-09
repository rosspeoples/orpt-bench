from __future__ import annotations

from pathlib import Path

import yaml


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
notes = (root / "docs" / "dns-automation-contract.md").read_text()
deployment = yaml.safe_load((root / "external-dns" / "deployment.yaml").read_text())
secret = yaml.safe_load((root / "external-dns" / "secret.yaml").read_text())


def single_arg_value(args: list[str], prefix: str) -> str | None:
    matches = [arg.split("=", 1)[1] for arg in args if arg.startswith(f"{prefix}=")]
    require(len(matches) == 1, f"expected exactly one {prefix} argument")
    return matches[0]


def repeated_arg_values(args: list[str], prefix: str) -> set[str]:
    return {arg.split("=", 1)[1] for arg in args if arg.startswith(f"{prefix}=")}

require("ExternalDNS talks RFC2136 back to the router authority" in notes, "DNS automation contract missing")

require(deployment.get("kind") == "Deployment", "ExternalDNS deployment manifest missing")
require(deployment.get("apiVersion") == "apps/v1", "ExternalDNS deployment apiVersion must stay apps/v1")
meta = deployment.get("metadata") or {}
require(meta.get("name") == "external-dns", "deployment name must stay external-dns")
require(meta.get("namespace") == "networking", "deployment namespace must stay networking")
selector = ((deployment.get("spec") or {}).get("selector") or {}).get("matchLabels") or {}
template_labels = (((deployment.get("spec") or {}).get("template") or {}).get("metadata") or {}).get("labels") or {}
require(selector == {"app": "external-dns"}, "ExternalDNS selector labels must stay on app=external-dns")
require(template_labels == selector, "ExternalDNS pod template labels must match the deployment selector")

containers = (((deployment.get("spec") or {}).get("template") or {}).get("spec") or {}).get("containers") or []
external_dns_containers = [container for container in containers if container.get("name") == "external-dns"]
require(len(external_dns_containers) == 1, "deployment must define exactly one external-dns container")
container = external_dns_containers[0]

args = container.get("args") or []
require(single_arg_value(args, "--provider") == "rfc2136", "ExternalDNS provider must be rfc2136")
require(repeated_arg_values(args, "--source") == {"service", "ingress"}, "ExternalDNS sources must be service and ingress")
require(single_arg_value(args, "--registry") == "txt", "ExternalDNS registry must stay txt")
require(single_arg_value(args, "--txt-owner-id") == "thepeoples-dev-k3s", "ExternalDNS TXT owner id mismatch")
require(single_arg_value(args, "--domain-filter") == "thepeoples.dev", "ExternalDNS domain filter mismatch")
require(single_arg_value(args, "--rfc2136-host") == "10.42.0.1", "ExternalDNS RFC2136 host mismatch")
require(single_arg_value(args, "--rfc2136-port") == "53", "ExternalDNS RFC2136 port mismatch")
require(single_arg_value(args, "--rfc2136-zone") == "thepeoples.dev", "ExternalDNS RFC2136 zone mismatch")
require(single_arg_value(args, "--rfc2136-tsig-secret-alg") == "hmac-sha256", "ExternalDNS TSIG algorithm mismatch")
require(single_arg_value(args, "--rfc2136-tsig-keyname") == "externaldns.", "ExternalDNS TSIG key name mismatch")
require(single_arg_value(args, "--rfc2136-tsig-secret") == "$(RFC2136_TSIG_SECRET)", "ExternalDNS TSIG secret wiring mismatch")
require(not any(arg.startswith("--provider=") and arg != "--provider=rfc2136" for arg in args), "ExternalDNS must not keep non-RFC2136 provider args")

env = {entry.get("name"): entry for entry in container.get("env") or []}
require("DNS_SECRET" not in env, "ExternalDNS must not keep the legacy DNS_SECRET env var")
tsig_secret = env.get("RFC2136_TSIG_SECRET") or {}
secret_ref = ((tsig_secret.get("valueFrom") or {}).get("secretKeyRef") or {})
require(secret_ref.get("name") == "external-dns-rfc2136-tsig", "RFC2136 TSIG env var must read from external-dns-rfc2136-tsig")
require(secret_ref.get("key") == "tsig-secret", "RFC2136 TSIG env var must read the tsig-secret key")

require(secret.get("kind") == "Secret", "TSIG secret manifest missing")
require(secret.get("apiVersion") == "v1", "TSIG secret apiVersion must stay v1")
require(secret.get("metadata", {}).get("name") == "external-dns-rfc2136-tsig", "TSIG secret must be named external-dns-rfc2136-tsig")
require(secret.get("metadata", {}).get("namespace") == "networking", "TSIG secret must live in networking")
require(secret.get("type") == "Opaque", "TSIG secret must stay Opaque")
string_data = secret.get("stringData") or {}
require(set(string_data) == {"tsig-secret"}, "TSIG secret must define only the tsig-secret key in stringData")

print("ok")
