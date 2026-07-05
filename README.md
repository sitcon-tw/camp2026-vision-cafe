# camp2026-vision-cafe

Vision Cafe speaker preference and assignment app for CAMP 2026.

## Stack

- `frontend`: Vite, React, TypeScript, Tailwind CSS v4, shadcn/ui
- `backend`: Rust API with Axum, MongoDB, GitHub OAuth, and Google Sheets roster lookup

## Source Layout

- `frontend/src/routes`: frontend route components.
- `frontend/src/components/ui`: reusable UI primitives.
- `frontend/src/lib`: frontend utilities, shared API types, and display grouping helpers.
- `backend/src`: Rust API service and backend domain logic.
- `backend/shared`: shared static configuration used by both frontend and backend.

## Development

```bash
cd frontend
pnpm install
pnpm dev

cd ../backend
cargo run
```

Vite runs on `http://localhost:5173` and proxies `/api/*` to the Rust API on `http://localhost:3000`.

## Commands

Frontend commands run from `frontend/`:

```bash
pnpm install
pnpm dev
pnpm preview
pnpm test
pnpm typecheck
pnpm lint
pnpm format
pnpm format:write
pnpm build
pnpm quality
```

Backend commands run from `backend/`:

```bash
cargo run
cargo fmt --check
cargo test
cargo clippy -- -D warnings
cargo build --release
```

## Docker

Docker Compose is a root-level stack command:

```bash
docker compose up --build
docker compose up --watch
```

The compose stack is Dokploy-oriented: the `app` service is attached to `dokploy-network` and exposes port `3000` for Dokploy Domains, while `mongodb` is only attached to the internal `app-private` network and is not published to the host.

For Dokploy, add the variables from `.env.example` in the service Environment tab. Set the domain to service `app` on port `3000`, and set `APP_BASE_URL` to the public HTTPS URL for OAuth callbacks and cookies.

For local compose usage, create the external routing network once if it does not already exist:

```bash
docker network create dokploy-network
```

Compose reads deployment settings from root `.env` or the Dokploy Environment tab. The app always connects to the `mongodb` service with the same credentials used to initialize MongoDB. Compose Watch rebuilds the app image when files under `frontend/` or `backend/` change, while ignoring generated build and dependency folders.
