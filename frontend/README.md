# Frontend

This folder contains the legacy React SPA extracted from the Rails app.

## Start (development)

1. Install dependencies

```sh
yarn install
```

2. Start Rails API in `../backend`

```sh
cd ../backend
bundle exec rails s -p 3000
```

3. Start frontend dev server

```sh
cd ../frontend
yarn start
```

The frontend runs on `http://localhost:3035` and proxies `/api` requests to `http://localhost:3000`.
