# DB-SQL Monorepo

Repository split into two deployable units:

- `backend/`: Rails API app (Dokku target)
- `frontend/`: legacy React SPA (CDN/static hosting target)

## Local development

1. Start backend API

```sh
cd backend
bundle exec rails s -p 3000
```

2. Start frontend SPA dev server

```sh
cd frontend
yarn install
yarn start
```

Frontend runs at `http://localhost:3035` and proxies `/api` to `http://localhost:3000`.
