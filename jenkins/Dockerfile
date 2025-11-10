# Jenkins custom image with Docker CLI and Docker Compose
FROM jenkins/jenkins:lts

USER root

# Install basic tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg2 \
    lsb-release \
    git \
  && rm -rf /var/lib/apt/lists/*

# Install Docker CLI (static binary)
ENV DOCKER_CLI_VERSION=24.0.5
RUN curl -fsSL "https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_CLI_VERSION}.tgz" \
  | tar -xz -C /usr/local/bin --strip-components=1 docker/docker \
  && chmod +x /usr/local/bin/docker

# Install Docker Compose v2 as CLI plugin and provide docker-compose compatibility
ENV DOCKER_COMPOSE_VERSION=2.20.2
RUN mkdir -p /usr/local/lib/docker/cli-plugins && \
    curl -fsSL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose && \
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose && \
    ln -s /usr/local/lib/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose || true

USER jenkins

# Healthcheck (optional) - basic version
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD curl -fsS http://localhost:8080/ || exit 1
