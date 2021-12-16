FROM ubuntu:20.04 AS rubybuild

# build with
# docker build . -t lebalz/ubuntu-ruby:latest
# docker push lebalz/ubuntu-ruby:tagname

ENV RUBY_PATH=/usr/local
ENV RUBY_VERSION=3.0.2

# for tz data
ENV DEBIAN_FRONTEND=noninteractive 
ENV TZ=Europe/Zurich

RUN apt-get update && \
    apt-get install -y \
    autoconf\
    bison \
    build-essential \
    libssl-dev \
    libyaml-dev \
    libreadline6-dev \
    zlib1g-dev \
    libncurses5-dev \
    libffi-dev \
    libgdbm6 \
    libgdbm-dev \
    libdb-dev \
    apt-utils \
    locales \
    git \
    curl \
    gcc \
    make \
    libssl-dev \
    zlib1g-dev \
    libreadline-dev \
    libmysqlclient-dev \
    libffi-dev \
    redis-server \
    build-essential \
    mysql-client \
    libxslt1-dev \
    libsqlite3-dev

RUN git clone git://github.com/rbenv/ruby-build.git $RUBY_PATH/plugins/ruby-build && \
    $RUBY_PATH/plugins/ruby-build/install.sh
RUN ruby-build $RUBY_VERSION $RUBY_PATH/

# ditch unused dev dependencies
FROM ubuntu:20.04
ENV RUBY_PATH=/usr/local

ENV PATH $RUBY_PATH/bin:$PATH
RUN apt-get update && \
    apt-get install -y \
    git \
    curl \
    gcc \
    make \
    libssl-dev \
    libyaml-dev \
    zlib1g-dev \
    libmysqlclient-dev

COPY --from=rubybuild $RUBY_PATH $RUBY_PATH
CMD [ "irb" ]