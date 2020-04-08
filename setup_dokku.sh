#!/usr/bin/env bash

set -e

# This sets up db-sql on a blank dokku instance (http://dokku.viewdocs.io/dokku/)

# USAGE: ./setup_dokku.sh -i 192.168.145.123 -d domain.ch

usage="usage: setup_dokku.ssh -i ip of dokku
                       -d dokku-domain
                       [-u dokku root user (default: root)]
                       [-n app name on dokku (default: db-sql)]
                       [-g name of git remote (default: db-sql)]
                       [-h help]"

while getopts "i:d:g:k:u:n:h" option; do
  case "${option}" in
    k) RAILS_MASTER_KEY=${OPTARG};;
    i) IP=${OPTARG};;
    d) DOMAIN=${OPTARG};;
    u) SSH_USER=${OPTARG};;
    n) APP_NAME=${OPTARG};;
    g) GIT_REMOTE_NAME=${OPTARG};;
    h) echo "$usage"
      exit 0
      ;;
  esac
done

if [[ -z "$SSH_USER" ]]; then
  SSH_USER="root"
else
  echo "SSH_USER=$SSH_USER"
fi


if [[ -z "$RAILS_MASTER_KEY" ]]; then
  RAILS_MASTER_KEY=$(cat ./config/master.key)
else
  echo "use custom rails master key"
fi

if [[ -z "$APP_NAME" ]]; then
  APP_NAME="db-sql"
else
  echo "APP_NAME=$APP_NAME"
fi

if [[ -z "$GIT_REMOTE_NAME" ]]; then
  GIT_REMOTE_NAME="dokku"
else
  echo "GIT_REMOTE_NAME=$GIT_REMOTE_NAME"
fi

# install postgres dokku plugin if not already installed
ssh -T ${SSH_USER}@${IP} 'curl -s https://gist.githubusercontent.com/lebalz/0877cc16ead689a5c785e4bf6626f9ed/raw/install_postgres.sh | bash'

# create and configure db-sql app
ssh -T ${SSH_USER}@${IP} "curl -s https://gist.githubusercontent.com/lebalz/0877cc16ead689a5c785e4bf6626f9ed/raw/db-sql-setup.sh | bash -s -- -k ${RAILS_MASTER_KEY} -n ${APP_NAME}"

# check if a dokku remote was already added
if [[ -z $(git remote show | grep ${GIT_REMOTE_NAME}) ]]; then
  echo "# ---- add git remote"
  git remote add ${GIT_REMOTE_NAME} dokku@${IP}:${APP_NAME}
fi

echo "# ---- deploying ${APP_NAME}"
git push ${GIT_REMOTE_NAME} $(basename $(git symbolic-ref HEAD)):master

# install plugin letsencrypt for dokku if not present
ssh -T ${SSH_USER}@${IP} 'curl -s https://gist.githubusercontent.com/lebalz/0877cc16ead689a5c785e4bf6626f9ed/raw/install_letsencrypt.sh | bash'

echo "# ---- configure letsencrypt"
{
ssh -T ${SSH_USER}@${IP} << EOF
if [[ -z \$(dokku letsencrypt:ls | grep ${APP_NAME}) ]]; then
  dokku domains:add ${APP_NAME} "${APP_NAME}.${DOMAIN}"
  dokku config:set --no-restart ${APP_NAME} DOKKU_LETSENCRYPT_EMAIL=$(git config user.email)
  dokku letsencrypt ${APP_NAME}
fi
EOF
}

echo "# ---- DONE"
