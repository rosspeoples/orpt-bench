from __future__ import annotations

from pathlib import Path


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


def strip_comments(text: str) -> str:
    lines = []
    for raw_line in text.splitlines():
        line = raw_line.split("#", 1)[0].rstrip()
        if line.strip():
            lines.append(line)
    return "\n".join(lines)


def extract_block(text: str, header: str) -> str:
    start = text.find(header)
    require(start >= 0, f"missing block header: {header}")
    open_brace = text.find("{", start)
    require(open_brace >= 0, f"missing opening brace for block: {header}")

    depth = 0
    for index in range(open_brace, len(text)):
        char = text[index]
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return text[open_brace + 1:index]

    raise SystemExit(f"unterminated block: {header}")


def normalize(line: str) -> str:
    return " ".join(line.split())


def normalized_lines(block: str) -> set[str]:
    return {normalize(line) for line in block.splitlines() if line.strip()}


root = Path(__file__).parent / "workspace"
runbook = (root / "docs" / "router-nftables-runbook.md").read_text()
rules = strip_comments((root / "nftables" / "router.nft").read_text())

require("nftables remains the source of truth" in runbook, "router nftables runbook missing")

filter_table = extract_block(rules, "table inet filter")
nat_table = extract_block(rules, "table ip nat")

input_chain = extract_block(filter_table, "chain input")
forward_chain = extract_block(filter_table, "chain forward")
prerouting_chain = extract_block(nat_table, "chain prerouting")
postrouting_chain = extract_block(nat_table, "chain postrouting")

require("policy drop;" in normalize(input_chain), "input chain must default to drop")
require("policy drop;" in normalize(forward_chain), "forward chain must default to drop")

forward_rules = normalized_lines(forward_chain)
prerouting_rules = normalized_lines(prerouting_chain)
postrouting_rules = normalized_lines(postrouting_chain)

require('ct state established,related accept' in forward_rules, 'forward chain must allow established and related traffic')
require('iifname "lan0" oifname "wan0" ct state new,established,related accept' in forward_rules, 'forward chain must allow new LAN to WAN traffic')
require('iifname "wan0" oifname "lan0" ct state established,related accept' in forward_rules, 'forward chain must allow established WAN return traffic')
require('iifname "wan0" oifname "lan0" ip daddr 10.42.0.20 tcp dport { 80, 443 } ct state new,established,related accept' in forward_rules, 'forward chain must allow DNATed ingress traffic to 10.42.0.20')
require('iifname "lan0" oifname "wan0" tcp flags syn tcp option maxseg size set rt mtu' in forward_rules, 'forward chain must clamp MSS for forwarded SYN packets')
require('iifname "wan0" tcp dport 80 dnat to 10.42.0.20:80' in prerouting_rules, 'prerouting must DNAT 80/tcp to the ingress VIP')
require('iifname "wan0" tcp dport 443 dnat to 10.42.0.20:443' in prerouting_rules, 'prerouting must DNAT 443/tcp to the ingress VIP')
require('oifname "wan0" ip saddr 10.42.0.0/24 masquerade' in postrouting_rules, 'postrouting must masquerade LAN traffic toward the WAN')
require('iptables-legacy' not in rules, 'ruleset must stay nftables-native')

print("ok")
