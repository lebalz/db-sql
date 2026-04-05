# DB-SQL Monorepo

Repository split into two deployable units:

- `backend/`: Rails API app (Dokku target)
- `frontend/`: legacy React SPA (CDN/static hosting target)

## Local development

### Dev Container (recommended)

Open the repository root in VS Code and run `Dev Containers: Reopen in Container`.

The root devcontainer includes:

- Rails backend runtime in `backend/`
- React frontend toolchain in `frontend/`
- Postgres, Redis and Selenium sidecar services

Useful commands inside the container:

```sh
# start backend API
cd backend
bundle exec rails s -p 3000 -b 0.0.0.0

# start frontend SPA dev server (new terminal)
cd frontend
yarn start
```

Forwarded ports:

- `3000` Rails API
- `3035` React frontend
- `7900` Selenium VNC

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
