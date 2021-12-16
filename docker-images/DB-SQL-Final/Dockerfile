FROM lebalz/ubuntu-ruby:latest
LABEL maintainer="lebalz@outlook.com"

# build with
# cd docker-images/DB-SQL-Final
# docker build . -t lebalz/rails-full-final:latest
# docker push lebalz/rails-full-final:latest

# For tzdata
ENV DEBIAN_FRONTEND=noninteractive 
ENV TZ=Europe/Zurich

RUN echo "# Essentials" && \
      apt-get update && \
      apt-get install -y curl \
            postgresql-client \
            mysql-client \
            openssl \
            libffi-dev \
            libyaml-dev \
            tzdata \
            bash \
            build-essential \
            cmake \
            file

# Configure Rails
ENV RAILS_LOG_TO_STDOUT true
ENV RAILS_SERVE_STATIC_FILES true
ENV BUNDLE_PATH=/usr/local/bundle/gems/

WORKDIR /app

# Expose Puma port
EXPOSE 3000

# Write GIT commit SHA and TIME to env vars
ONBUILD ARG COMMIT_SHA
ONBUILD ARG COMMIT_TIME

ONBUILD ENV COMMIT_SHA ${COMMIT_SHA}
ONBUILD ENV COMMIT_TIME ${COMMIT_TIME}

# Add user
ONBUILD RUN addgroup --system --gid 1000 app && \
            adduser --system --uid 1000 app --ingroup app

# Copy app with gems from former build stage
ONBUILD COPY --from=Builder /usr/local/bundle/ /usr/local/bundle/
ONBUILD COPY --from=Builder --chown=app:app /app /app
