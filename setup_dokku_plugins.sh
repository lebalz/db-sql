#!/usr/bin/env bash


echo "# ---------------------------------------------------------------------------- #"
echo "# --------------------------- check dokku plugins ---------------------------- #"
if [[ -z $(dokku plugin:list | egrep -oh "postgres.+enabled")  ]]; then
  if [[ -z $(dokku plugin:list | egrep -oh "postgres.+disabled") ]]; then
    echo "# ----------------------- Install dokku postgres plugin ---------------------- #"
    dokku plugin:install https://github.com/dokku/dokku-postgres.git postgres
  else
    echo "# ----------------------- Enable dokku postgres plugin ----------------------- #"
    dokku plugin:enable postgres
  fi
else
  echo "# ----------------------- postgres already installed ------------------------- #"
fi

echo "# Check for dokku letsencrypt plugin"
if [[ -z $(dokku plugin:list | egrep -oh "letsencrypt.+enabled")  ]]; then
  if [[ -z $(dokku plugin:list | egrep -oh "letsencrypt.+disabled") ]]; then
    echo "# ----------------------- install dokku letsencrypt -------------------------- #"
    dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
  else
    echo "# -------------------- Enable dokku letsencrypt plugin ----------------------- #"
    dokku plugin:enable letsencrypt
  fi
else
  echo "# -------------------- letsencrypt already installed ------------------------- #"
fi
echo "# ---------------------------------------------------------------------------- #"
