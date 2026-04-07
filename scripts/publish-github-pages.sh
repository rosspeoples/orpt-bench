#!/usr/bin/env bash

set -euo pipefail

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    printf 'missing required environment variable: %s\n' "$name" >&2
    exit 1
  fi
}

require_env PUBLISH_GITHUB_USERNAME
require_env PUBLISH_GITHUB_TOKEN
require_env PUBLISH_GITHUB_REPOSITORY
require_env PUBLISH_GITHUB_PAGES_BRANCH

source_branch="${PUBLISH_SOURCE_BRANCH:-${GITHUB_REF_NAME:-main}}"
pages_output_dir="${PUBLISH_PAGES_OUTPUT_DIR:-.site}"
build_script="${PUBLISH_PAGES_BUILD_SCRIPT:-scripts/build-github-pages.sh}"
github_api_url="${PUBLISH_GITHUB_API_URL:-https://api.github.com}"

tmpdir="$(mktemp -d)"
askpass_script="${tmpdir}/git-askpass.sh"

cleanup() {
  rm -rf "${tmpdir}"
}
trap cleanup EXIT

cat >"${askpass_script}" <<'EOF'
#!/usr/bin/env bash
case "$1" in
  *Username*) printf '%s\n' "${PUBLISH_GITHUB_USERNAME}" ;;
  *) printf '%s\n' "${PUBLISH_GITHUB_TOKEN}" ;;
esac
EOF
chmod 0700 "${askpass_script}"

export GIT_ASKPASS="${askpass_script}"
export GIT_TERMINAL_PROMPT=0

github_repo_path="${PUBLISH_GITHUB_REPOSITORY#https://github.com/}"
github_repo_path="${github_repo_path%.git}"
github_repo_owner="${github_repo_path%%/*}"
github_repo_name="${github_repo_path#*/}"

if [[ -z "${github_repo_owner}" || -z "${github_repo_name}" || "${github_repo_owner}" == "${github_repo_name}" ]]; then
  printf 'unsupported GitHub repository URL: %s\n' "${PUBLISH_GITHUB_REPOSITORY}" >&2
  exit 1
fi

github_api_request() {
  local method="$1"
  local url="$2"
  local data="${3:-}"
  local response_body="${tmpdir}/github-api-body.json"
  local status=""

  if [[ -n "${data}" ]]; then
    status="$(curl -sS -o "${response_body}" -w '%{http_code}' -X "${method}" \
      -H "Authorization: Bearer ${PUBLISH_GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      -H "Content-Type: application/json" \
      -d "${data}" \
      "${url}")"
  else
    status="$(curl -sS -o "${response_body}" -w '%{http_code}' -X "${method}" \
      -H "Authorization: Bearer ${PUBLISH_GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "${url}")"
  fi

  printf '%s\n' "${status}"
}

ensure_github_pages() {
  local repo_api="${github_api_url}/repos/${github_repo_owner}/${github_repo_name}"
  local pages_payload="{\"source\":{\"branch\":\"${PUBLISH_GITHUB_PAGES_BRANCH}\",\"path\":\"/\"}}"
  local status=""

  status="$(github_api_request GET "${repo_api}")"
  if [[ "${status}" != "200" ]]; then
    printf 'GitHub repository %s/%s is not available: HTTP %s\n' "${github_repo_owner}" "${github_repo_name}" "${status}" >&2
    exit 1
  fi

  status="$(github_api_request GET "${repo_api}/pages")"
  case "${status}" in
    200)
      status="$(github_api_request PUT "${repo_api}/pages" "${pages_payload}")"
      ;;
    404)
      status="$(github_api_request POST "${repo_api}/pages" "${pages_payload}")"
      ;;
  esac

  case "${status}" in
    200|201|202)
      printf 'ensured GitHub Pages source %s on %s/%s\n' "${PUBLISH_GITHUB_PAGES_BRANCH}" "${github_repo_owner}" "${github_repo_name}"
      ;;
    *)
      printf 'failed to configure GitHub Pages for %s/%s: HTTP %s\n' "${github_repo_owner}" "${github_repo_name}" "${status}" >&2
      exit 1
      ;;
  esac
}

if git remote get-url github >/dev/null 2>&1; then
  git remote set-url github "${PUBLISH_GITHUB_REPOSITORY}"
else
  git remote add github "${PUBLISH_GITHUB_REPOSITORY}"
fi

printf 'syncing source branch %s to %s\n' "${source_branch}" "${PUBLISH_GITHUB_REPOSITORY}"
git push --force github "HEAD:${source_branch}"

if [[ ! -f "${build_script}" ]]; then
  printf 'no %s found; skipping Pages publication after source sync\n' "${build_script}"
  exit 0
fi

rm -rf "${pages_output_dir}"
mkdir -p "${pages_output_dir}"

printf 'building static site with %s\n' "${build_script}"
PUBLISH_PAGES_OUTPUT_DIR="${pages_output_dir}" GITHUB_PAGES_OUTPUT_DIR="${pages_output_dir}" bash "${build_script}"

if [[ ! -d "${pages_output_dir}" ]]; then
  printf 'pages output directory was not created: %s\n' "${pages_output_dir}" >&2
  exit 1
fi

pages_workdir="${tmpdir}/pages"
mkdir -p "${pages_workdir}"

git -C "${pages_workdir}" init
git -C "${pages_workdir}" config user.name "gitea-actions"
git -C "${pages_workdir}" config user.email "gitea-actions@thepeoples.dev"
git -C "${pages_workdir}" remote add origin "${PUBLISH_GITHUB_REPOSITORY}"

if git ls-remote --exit-code --heads "${PUBLISH_GITHUB_REPOSITORY}" "${PUBLISH_GITHUB_PAGES_BRANCH}" >/dev/null 2>&1; then
  git -C "${pages_workdir}" fetch --depth=1 origin "${PUBLISH_GITHUB_PAGES_BRANCH}"
  git -C "${pages_workdir}" checkout -B "${PUBLISH_GITHUB_PAGES_BRANCH}" FETCH_HEAD
else
  git -C "${pages_workdir}" checkout --orphan "${PUBLISH_GITHUB_PAGES_BRANCH}"
fi

shopt -s dotglob nullglob
for entry in "${pages_workdir}"/*; do
  if [[ "$(basename "${entry}")" == ".git" ]]; then
    continue
  fi
  rm -rf "${entry}"
done
shopt -u dotglob nullglob

cp -a "${pages_output_dir}/." "${pages_workdir}/"
touch "${pages_workdir}/.nojekyll"

git -C "${pages_workdir}" add --all
if git -C "${pages_workdir}" diff --cached --quiet; then
  printf 'no Pages changes detected; publication branch is already up to date\n'
  exit 0
fi
git -C "${pages_workdir}" commit -m "Publish GitHub Pages from Gitea Actions"

printf 'publishing Pages branch %s to %s\n' "${PUBLISH_GITHUB_PAGES_BRANCH}" "${PUBLISH_GITHUB_REPOSITORY}"
git -C "${pages_workdir}" push --force origin "HEAD:${PUBLISH_GITHUB_PAGES_BRANCH}"
ensure_github_pages
