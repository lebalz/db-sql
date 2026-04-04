# Make sure RUBY_VERSION matches the Ruby version in .ruby-version
ARG RUBY_VERSION=4.0.2
FROM ghcr.io/rails/devcontainer/images/ruby:$RUBY_VERSION

RUN sudo apt update && sudo apt install -y \
  graphviz \
  default-libmysqlclient-dev \
  libsqlite3-dev \
  libpq-dev \
  build-essential
