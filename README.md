[![Build Status](https://travis-ci.com/lebalz/db-sql.svg?branch=master)](https://travis-ci.com/lebalz/db-sql)

# DB-SQL

<p align="center">
  <a href="#"><img width="250" src="./docs/logo.png"></a>
</p>

## Setup

### PreRequirements
- Ruby v2.6.2
- bundler `gem install bundler`
- [Yarn](https://yarnpkg.com/en/docs/install)

### Install

1. `cp .env.example .env`
2. Update `.env` with your db credentials.
3. `yarn install`
4. `bundle`
5.  (on first time setup, see [configure postgres](#configure-postgres))
6. `rails db:setup`

In development, `rails db:setup` will seed a default user `rails db:seed` with the password `asdfasdf` and some db connections for this user.
To customize your seeds, see [Custom Seeds](#custom-seeds)

To reseed, run
```sh
bundle exec rails db:drop db:setup
```

## Start Rails

Rails is expected to run on port `3000`. Start it with
```sh
bundle exec rails start
```
and visit [http://localhost:3000](http://localhost:3000)

### Webpacker

To use webpacker, start it with

```sh
bin/wepacker-dev-server
```

### configure postgres

To create a new postgres user for this project:
```sh
sudo -u postgres psql
postgres=# CREATE USER foo WITH ENCRYPTED PASSWORD 'bar';
postgres=# ALTER ROLE foo WITH superuser;
```

If pgcrypto is not installed for a database, install it to the public schema:
```sh
$ sudo -u postgres psql
postgres=# CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;
```

### Custom Seeds

If you need for development custom seeds of DbConnections with confidential credentials, then create a new File `seed_db_connections.yaml` in root:

```sh
cp seed_db_connections.example.yaml seed_db_connections.yaml
```
edit it to your needs and reseed.

The fields `db_initial_db` and `db_initial_schema` ar optional.

## Swagger

The project uses a grape api and supports swagger ui. It expects rails to running on port `3000` and that the user `test@user.ch` with password `asdfasdf` is seeded.

```sh
node swagger_ui.js
```

will start swagger on [http://localhost:4000](http://localhost:4000).

## Mailing

In production [Sendgrid](https://sendgrid.com) is used to send mails. Fill in your credentials
in the `.env` file to work with sendgrid. (`API Keys > Create API Key > Full Access`).

### Mails in Development

Use the mailcatcher gem to receive emails in development: `bundle exec mailcatcher`.
Mails sent with `:smtp` to [http://localhost:1025](http://localhost:1025) are catched by mailcatcher and can be seen in the inbox at [http://localhost:1080](http://localhost:1080).
