# camp2026-vision-cafe

Clean Next.js starter for the CAMP 2026 Vision Cafe app.

## Stack

- Next.js App Router
- React, TypeScript, Tailwind CSS v4
- shadcn components and CAMP 2026 theme tokens in `src/components` and `src/app/globals.css`

## Source layout

- `src/app`: Next.js routes and route-private `_components`.
- `src/components/ui`: reusable UI primitives.
- `src/hooks`: reusable React hooks.
- `src/lib`: utilities, domain logic, repositories, validation, and integrations.
- `src/types`: ambient TypeScript declarations.

## Development

```bash
pnpm install
pnpm dev
```

The app runs on `http://localhost:3000`.
