terraform {
  required_version = ">= 1.5.0"
}

variable "bucket_name" {
  type = string
}

resource "aws_s3_bucket" "site" {
  bucket = "demo-static-site"
}

resource "aws_s3_bucket_website_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  index_document {
    suffix = "home.html"
  }
}

resource "aws_cloudfront_distribution" "site" {
  enabled = false

  origin {
    domain_name = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id   = "site-origin"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    viewer_protocol_policy = "allow-all"
    target_origin_id       = "site-origin"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}
