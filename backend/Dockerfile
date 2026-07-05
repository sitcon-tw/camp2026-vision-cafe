FROM node:24-bookworm-slim AS frontend-builder

WORKDIR /app/frontend
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend ./
COPY backend/shared ../backend/shared
RUN pnpm build

FROM rust:1-bookworm AS backend-builder

WORKDIR /app/backend

COPY backend/Cargo.toml backend/Cargo.lock ./
COPY backend/src ./src
COPY backend/shared ./shared
RUN cargo build --release

FROM debian:bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV STATIC_DIR=/app/frontend/dist

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 app \
  && useradd --system --uid 1001 --gid app app

COPY --from=backend-builder /app/backend/target/release/vision-cafe-api /usr/local/bin/vision-cafe-api
COPY --from=frontend-builder --chown=app:app /app/frontend/dist ./frontend/dist

USER app

EXPOSE 3000

CMD ["vision-cafe-api"]
