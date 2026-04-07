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
- `results/charts/*.html`
- `models/README.md`

The publication flow treats `Gitea` as the source of truth and force-pushes both the GitHub source branch and the generated `gh-pages` branch.
