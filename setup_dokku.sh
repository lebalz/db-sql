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


echo "create app and service"
{
ssh -i ${SSH_KEY} -T ${SSH_USER}@${IP} << EOF
if [[ -z \$(dokku apps:exists ${APP_NAME}) ]]; then
  echo "${APP_NAME} exists"
else
  dokku apps:create ${APP_NAME}
  dokku postgres:create ${APP_NAME}
  dokku postgres:link ${APP_NAME} ${APP_NAME}
fi
dokku config:set ${APP_NAME} RAILS_MASTER_KEY=$(cat config/master.key)
dokku config:set ${APP_NAME} RAILS_SERVE_STATIC_FILES="1"
EOF
}

echo "# set git remote"
if [[ -z $(git remote show | grep ${DOKKU_REMOTE_NAME}) ]]; then
  git remote add ${DOKKU_REMOTE_NAME} dokku@${IP}:${APP_NAME}
fi
git push ${DOKKU_REMOTE_NAME} $(basename $(git symbolic-ref HEAD)):master


echo "configure letsencrypt"
{
ssh -i ${SSH_KEY} -T ${SSH_USER}@${IP} << EOF
  dokku config:set --no-restart ${APP_NAME} DOKKU_LETSENCRYPT_EMAIL=$(git config user.email)
  dokku letsencrypt ${APP_NAME}
EOF
}