from __future__ import annotations

from pathlib import Path


def require(cond: bool, message: str) -> None:
    if not cond:
        print(message)
        raise SystemExit(1)


main_tf = (Path(__file__).parent / "workspace" / "main.tf").read_text()

require('resource "aws_s3_bucket" "site"' in main_tf, "site bucket resource must exist")
require('bucket = var.bucket_name' in main_tf, "bucket must use var.bucket_name")
require('resource "aws_s3_bucket_website_configuration" "site"' in main_tf, "website configuration missing")
require('index_document {' in main_tf and 'suffix = "index.html"' in main_tf, "index document must be index.html")
require('error_document {' in main_tf and 'key = "404.html"' in main_tf, "error document must be 404.html")
require('resource "aws_cloudfront_distribution" "site"' in main_tf, "cloudfront distribution missing")
require('enabled             = true' in main_tf or 'enabled = true' in main_tf, "distribution must be enabled")
require('default_root_object = "index.html"' in main_tf, "default root object must be index.html")
require('viewer_protocol_policy = "redirect-to-https"' in main_tf, "viewer protocol policy must redirect to https")

print("ok")
