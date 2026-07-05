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
