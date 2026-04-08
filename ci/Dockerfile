FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

ARG TERRAFORM_VERSION=1.8.5
ARG DOCKER_COMPOSE_VERSION=2.27.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ansible-core \
    bash \
    ca-certificates \
    curl \
    docker.io \
    git \
    jq \
    python3 \
    python3-yaml \
    python3-venv \
    python3-pip \
    rsync \
    unzip \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/local/libexec/docker/cli-plugins \
  && arch="$(dpkg --print-architecture)" \
  && case "$arch" in \
    amd64) compose_arch="x86_64" ;; \
    arm64) compose_arch="aarch64" ;; \
    *) echo "Unsupported architecture: $arch" >&2; exit 1 ;; \
  esac \
  && curl -fsSL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-${compose_arch}" -o /usr/local/libexec/docker/cli-plugins/docker-compose \
  && chmod +x /usr/local/libexec/docker/cli-plugins/docker-compose

RUN arch="$(dpkg --print-architecture)" \
  && case "$arch" in \
    amd64) terraform_arch="amd64" ;; \
    arm64) terraform_arch="arm64" ;; \
    *) echo "Unsupported architecture: $arch" >&2; exit 1 ;; \
  esac \
  && curl -fsSL "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_${terraform_arch}.zip" -o /tmp/terraform.zip \
  && unzip /tmp/terraform.zip -d /usr/local/bin \
  && rm /tmp/terraform.zip

WORKDIR /workspace

COPY package.json /workspace/package.json

RUN npm install --no-fund --no-audit \
  && npm install -g opencode-ai@1.3.17 \
  && python3 -m pip install --no-cache-dir --break-system-packages python-hcl2

COPY . /workspace

RUN chmod +x /workspace/ci/entrypoint.sh

ENTRYPOINT ["bash", "/workspace/ci/entrypoint.sh"]
CMD ["benchmark"]
