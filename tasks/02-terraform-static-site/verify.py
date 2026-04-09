from __future__ import annotations

import json
import re
from pathlib import Path


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


root = Path(__file__).parent / "workspace"
main_tf = root / "main.tf"
contract = json.loads((root / "docs" / "platform-contract.json").read_text())
main_tf_text = main_tf.read_text()

require(re.search(r'resource\s+"aws_s3_bucket"\s+"site"\s*\{', main_tf_text), "site bucket resource must exist")
require(re.search(r'bucket\s*=\s*var\.bucket_name\b', main_tf_text), "bucket must use var.bucket_name")

website_match = re.search(
    r'resource\s+"aws_s3_bucket_website_configuration"\s+"site"\s*\{(?P<body>.*?)\n\}',
    main_tf_text,
    re.S,
)
require(website_match is not None, "website configuration missing")
website_body = website_match.group("body")
require(re.search(r'bucket\s*=\s*aws_s3_bucket\.site\.id\b', website_body), "website configuration must target the site bucket")
require(re.search(r'index_document\s*\{[^}]*suffix\s*=\s*"index\.html"', website_body, re.S), "index document must be index.html")
require(re.search(r'error_document\s*\{[^}]*key\s*=\s*"404\.html"', website_body, re.S), "error document must be 404.html")

distribution_match = re.search(
    r'resource\s+"aws_cloudfront_distribution"\s+"site"\s*\{(?P<body>.*?)\n\}',
    main_tf_text,
    re.S,
)
require(distribution_match is not None, "cloudfront distribution missing")
distribution_body = distribution_match.group("body")
require(re.search(r'enabled\s*=\s*true\b', distribution_body), "distribution must be enabled")
require(re.search(r'default_root_object\s*=\s*"index\.html"', distribution_body), "default root object must be index.html")

require(
    re.search(r'default_cache_behavior\s*\{[^}]*viewer_protocol_policy\s*=\s*"redirect-to-https"', distribution_body, re.S),
    "viewer protocol policy must redirect to https"
)

require(contract["site"]["bucketVariable"] == "bucket_name", "platform contract bucket variable must remain bucket_name")
require(contract["site"]["indexDocument"] == "index.html", "platform contract index document must remain index.html")
require(contract["site"]["errorDocument"] == "404.html", "platform contract error document must remain 404.html")
require(contract["cdn"]["enabled"] is True, "platform contract CDN must remain enabled")
require(contract["cdn"]["viewerProtocolPolicy"] == "redirect-to-https", "platform contract viewer protocol policy must remain redirect-to-https")
require(contract["cdn"]["defaultRootObject"] == "index.html", "platform contract default root object must remain index.html")

print("ok")
