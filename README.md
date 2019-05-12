[![Build Status](https://travis-ci.com/lebalz/db-sql.svg?branch=master)](https://travis-ci.com/lebalz/db-sql)

# DB-SQL

## Setup

1. `mv .env.example .env`
2. Update `.env` with your credentials.
3. `yarn install`
4. `bundle`
5. `rails db:setup`

If pgcrypto is not installed for a database (and not the postgres user is used):

```
$ sudo -u postgres psql
postgres=# \c db_sql_<development|test>;
postgres=# CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```
