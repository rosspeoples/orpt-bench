# Docs Site Migration Notes

- This stack owns the public `docs.example.com` site.
- The bucket name must come from `var.bucket_name`; the module is reused across environments.
- S3 website hosting still serves the static content directly.
- CloudFront stays in front of the bucket and should redirect all viewers to HTTPS.
- The docs site entrypoint is `index.html` and the static error page remains `404.html`.
- Do not add unrelated resources or variables for this repair.
