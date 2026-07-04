@/Users/nathan/.codex/RTK.md

# Project Instructions

## Page Containers

- All top-level pages under `src/app` must use `AppPageShell` from `src/shared/ui/app-page-shell`.
- Do not hand-roll page-level `<main>` or content container class strings in individual pages.
- The standard page container is centered, full-height, mobile-first, and fixed to `max-w-md` with `px-4 py-5` and `gap-5`.
- If a page needs a deliberate exception, add an explicit opt-in prop to `AppPageShell` instead of duplicating container classes.
