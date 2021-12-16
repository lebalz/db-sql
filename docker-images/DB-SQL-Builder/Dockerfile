FROM lebalz/ubuntu-ruby:latest
LABEL maintainer="lebalz@outlook.com"

# build with
# cd docker-images/DB-SQL-Builder
# cp ../../{package.json,yarn.lock,Gemfile,Gemfile.lock} .
# docker build . -t lebalz/rails-full-builder
# docker push lebalz/rails-full-builder:latest


# For tzdata
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Zurich

RUN echo "# Essentials" && \
      apt-get update && \
      apt install -y curl wget git rsync patch build-essential software-properties-common

RUN apt-get install -my gnupg
RUN echo "# Generate locales" && \
      echo "# Upgrade apt" && \
      sed -i 's/main$/main contrib/g' /etc/apt/sources.list && \
      curl -sL https://deb.nodesource.com/setup_16.x | bash - && \
      curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
      echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get upgrade -y && \
      echo "# Install common dev dependencies via apt" && \
      apt-get install -y \
      openssl libreadline-dev libyaml-dev zlib1g zlib1g-dev libssl-dev libyaml-dev libpq-dev libxml2-dev libxslt-dev libc6-dev libmsgpack-dev \
      xvfb bzip2  \
      mysql-server  mysql-client\
      nodejs yarn \
      libxrender-dev gdebi apt-utils cmake tzdata postgresql-client && \
      ln -s /usr/bin/nodejs /usr/local/bin/node && \
      ln -sf /usr/share/zoneinfo/Europe/Berlin /etc/localtime

WORKDIR /app

RUN echo "# Update bundler" && \
      gem install bundler:2.2.27 --no-document

RUN echo "Install python2" && apt install -y python2 
# Install standard Node modules
COPY package.json yarn.lock /app/
RUN yarn install

# Install standard gems
COPY Gemfile* /app/ 

ENV BUNDLE_PATH=/usr/local/bundle/gems/

# Increase node heap
ENV NODE_OPTIONS='--max-old-space-size=8192'

RUN apt install libsqlite3-dev

RUN bundle config --global frozen 1 && \
      bundle config --local build.sassc --disable-march-tune-native && \
      bundle install -j4 --retry 3

# Install Ruby gems (for production only)
ONBUILD COPY Gemfile* /app/
ONBUILD RUN bundle install -j4 --retry 3 --without development:test && \
      # Remove unneeded gems
      bundle clean --force && \
      # Remove unneeded files from installed gems (cached *.gem, *.o, *.c)
      rm -rf /usr/local/bundle/cache/*.gem && \
      find /usr/local/bundle/gems/ -name "*.c" -delete && \
      find /usr/local/bundle/gems/ -name "*.o" -delete

# Copy the whole application folder into the image
ONBUILD COPY . /app


# Compile assets with webpacker
ONBUILD RUN RAILS_ENV=production \
      SECRET_KEY_BASE=dummy \
      bundle exec rails assets:precompile

# Remove folders not needed in resulting image
ONBUILD RUN rm -rf node_modules tmp/cache vendor/bundle test spec
