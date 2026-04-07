FROM node:22-bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    bash \
    ca-certificates \
    curl \
    git \
    jq \
    python3 \
    python3-venv \
    python3-pip \
    rsync \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY package.json /workspace/package.json

RUN npm install --no-fund --no-audit \
  && npm install -g opencode-ai@1.3.17

COPY . /workspace

RUN chmod +x /workspace/ci/entrypoint.sh

ENTRYPOINT ["bash", "/workspace/ci/entrypoint.sh"]
CMD ["benchmark"]
