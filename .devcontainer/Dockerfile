FROM mcr.microsoft.com/devcontainers/ruby:4.0

# Install system dependencies for pg, mysql2, and node
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      libpq-dev \
      default-libmysqlclient-dev \
      build-essential \
      git \
      curl && \
    rm -rf /var/lib/apt/lists/*

# Install Node.js LTS via feature (already handled by devcontainer features)
# Install Yarn
RUN corepack enable && corepack prepare yarn@stable --activate

WORKDIR /workspace
