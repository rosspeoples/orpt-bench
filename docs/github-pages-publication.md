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

- chart-first navigation for composite score, success rate, and ORPT
- sortable comparison tables that default to composite score
- documentation links for the design doc, result schema, model catalog, and raw JSON artifacts
- a generated history index when archived run snapshots are present

The publication flow treats `Gitea` as the source of truth and force-pushes both the GitHub source branch and the generated `gh-pages` branch.
