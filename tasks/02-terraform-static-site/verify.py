from __future__ import annotations

import json
import subprocess
from pathlib import Path

import hcl2


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
main_tf = root / "main.tf"
contract = json.loads((root / "docs" / "platform-contract.json").read_text())

subprocess.run(["terraform", "fmt", "-check", "-diff"], cwd=root, check=True, capture_output=True, text=True)

with main_tf.open("r", encoding="utf-8") as handle:
    config = hcl2.load(handle)

resources = {}
for resource_block in config.get("resource", []):
    for resource_type, instances in resource_block.items():
        for resource_name, body in instances.items():
            resources[(resource_type, resource_name)] = body

bucket = resources.get(("aws_s3_bucket", "site"))
website = resources.get(("aws_s3_bucket_website_configuration", "site"))
distribution = resources.get(("aws_cloudfront_distribution", "site"))

require(bucket is not None, "site bucket resource must exist")
require(bucket.get("bucket") == "${var.bucket_name}", "bucket must use var.bucket_name")

require(website is not None, "website configuration missing")
index_document = (website.get("index_document") or [{}])[0]
error_document = (website.get("error_document") or [{}])[0]
require(index_document.get("suffix") == contract["site"]["indexDocument"], "index document must be index.html")
require(error_document.get("key") == contract["site"]["errorDocument"], "error document must be 404.html")

require(distribution is not None, "cloudfront distribution missing")
require(distribution.get("enabled") is True, "distribution must be enabled")
require(distribution.get("default_root_object") == contract["cdn"]["defaultRootObject"], "default root object must be index.html")

default_cache = (distribution.get("default_cache_behavior") or [{}])[0]
require(default_cache.get("viewer_protocol_policy") == contract["cdn"]["viewerProtocolPolicy"], "viewer protocol policy must redirect to https")

print("ok")
