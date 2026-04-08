# GitHub Pages Publication

This repository can publish its benchmark summary to `GitHub Pages` from `Gitea Actions`.

Files:

- workflow: `.gitea/workflows/github-publication.yml`
- build script: `scripts/build-github-pages.sh`
- publication script: `scripts/publish-github-pages.sh`

Required repo-level `Gitea Actions` secrets:

- `PUBLISH_GITHUB_USERNAME`
- `PUBLISH_GITHUB_TOKEN`
- `PUBLISH_GITHUB_REPOSITORY`
- `PUBLISH_GITHUB_PAGES_BRANCH`

The build script publishes a small static site using the repository's generated benchmark artifacts:

- `results/leaderboard.md`
- `results/latest.json`
- `results/history/*.json`
- `results/charts/*.html`
- `models/README.md`
- `docs/result-schema.json`
- `DESIGN.md`

The generated Pages site is an interactive static dashboard rather than a markdown dump. It includes:

- an executive-summary row for completion score, value score, and composite score
- a top-level completion-versus-cost frontier chart
- sortable comparison tables and task matrix views directly beneath the summary charts
- expandable reference sections for benchmark context, smoke evidence, docs, raw artifacts, and history

The publication flow treats `Gitea` as the source of truth and force-pushes both the GitHub source branch and the generated `gh-pages` branch.

The `GitHub Publication` workflow currently targets the custom `benchmarks-orpt-bench` runner label for scheduling and explicitly runs inside `docker.gitea.com/runner-images:ubuntu-latest`. This repository does not have an `ubuntu-latest` runner available, so changing the workflow to `runs-on: ubuntu-latest` leaves publication jobs queued indefinitely until that label is provisioned on the Gitea instance.

The explicit job container also avoids the runner's default fallback image for custom labels, which was pulling `node:20-bookworm` from Docker Hub and failing under unauthenticated rate limits.
