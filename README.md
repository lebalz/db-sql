[![Build Status](https://travis-ci.com/lebalz/db-sql.svg?branch=master)](https://travis-ci.com/lebalz/db-sql)

# DB-SQL

## Setup

1. `cp .env.example .env`
2. Update `.env` with your credentials.
3. `yarn install`
4. `bundle`
5. `rails db:setup` *

### configure postgres *

To create a new postgres user for this project:
```
sudo -u postgres psql
postgres=# CREATE USER foo WITH ENCRYPTED PASSWORD 'bar';
postgres=# ALTER ROLTE foo WITH superuser;
```

If pgcrypto is not installed for a database, install it to the public schema:
```
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

