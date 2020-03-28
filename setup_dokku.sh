#!/usr/bin/env bash

# This sets up db-sql on a blank dokku instance (http://dokku.viewdocs.io/dokku/)

# USAGE: SSH_USER=root IP=192.168.145.123 ./setup_dokku.sh
# optional: provide ssh key to the setup process:
#   SSH_USER=root IP=192.168.145.123 SSH_KEY="~/.ssh/other_key.pub" ./setup_dokku.sh

if [ -z "$SSH_KEY" ]; then
  SSH_KEY="~/.ssh/id_rsa.pub"
fi

ssh -i ${SSH_KEY} -T ${SSH_USER}@${IP} 'bash -s' < setup_dokku_plugins.sh

APP_NAME='db-sql'
DOKKU_REMOTE_NAME='dokku'

echo "# ---------------------------------------------------------------------------- #"
echo "# ----------------------- create dokku app and services ---------------------- #"
echo "# ---------------------------------------------------------------------------- #"
{
ssh -i ${SSH_KEY} -T ${SSH_USER}@${IP} << EOF
  if [[ \$(ls /home/dokku/${APP_NAME}) ]]; then
    echo "${APP_NAME} exists"
  else
    dokku apps:create ${APP_NAME}
    dokku postgres:create ${APP_NAME}
    dokku postgres:link ${APP_NAME} ${APP_NAME}
  fi

  # db connection url - since executed from within the postgres container, change host to localhost
  DB_URL=\$(dokku config:get db-sql DATABASE_URL | sed 's/@.*:/@localhost:/')

  # ensure postgres extension 'pgcrypto' is installed
  dokku postgres:enter ${APP_NAME} psql \${DB_URL} -c 'CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;'

  # configure the rails app
  dokku config:set ${APP_NAME} RAILS_MASTER_KEY=$(cat config/master.key)
  dokku config:set ${APP_NAME} RAILS_SERVE_STATIC_FILES="1" RAILS_ENV="production" DOKKU_PROXY_PORT_MAP="http:80:3000" NO_VHOST="0" DOKKU_DOCKERFILE_PORTS="3000"

  # if you need special env's within the buildstep, add those as follows (e.g. the rails master key)
  # dokku docker-options:add ${APP_NAME} build "--build-arg RAILS_MASTER_KEY=$(cat config/master.key)"
EOF
}

# check if a dokku remote was already added
if [[ -z $(git remote show | grep ${DOKKU_REMOTE_NAME}) ]]; then
  echo "# ---------------------------------------------------------------------------- #"
  echo "# ------------------------------ add git remote ------------------------------ #"
  echo "# ---------------------------------------------------------------------------- #"
  git remote add ${DOKKU_REMOTE_NAME} dokku@${IP}:${APP_NAME}
fi

echo "# ---------------------------------------------------------------------------- #"
echo "# ----------------------- deploying ${APP_NAME} ------------------------------ #"
echo "# ---------------------------------------------------------------------------- #"
git push ${DOKKU_REMOTE_NAME} $(basename $(git symbolic-ref HEAD)):master

echo "# ---------------------------------------------------------------------------- #"
echo "# ----------------------- configure letsencrypt ------------------------------ #"
echo "# ---------------------------------------------------------------------------- #"
{
ssh -i ${SSH_KEY} -T ${SSH_USER}@${IP} << EOF
  dokku config:set --no-restart ${APP_NAME} DOKKU_LETSENCRYPT_EMAIL=$(git config user.email)
  dokku letsencrypt ${APP_NAME}
EOF
}


echo "# ---------------------------------------------------------------------------- #"
echo "# ------------------------------------ DONE ---------------------------------- #"
echo "# ---------------------------------------------------------------------------- #"