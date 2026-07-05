@/Users/nathan/.codex/RTK.md

# Project Instructions

## Page Containers

- All top-level frontend pages under `frontend/src/routes` must use `AppPageShell` from `frontend/src/components/ui/app-page-shell`.
- Do not hand-roll page-level `<main>`, content container, label, or title header class strings in individual pages.
- The standard page container is centered, full-height, mobile-first, and fixed to `max-w-md` with `px-4 py-5` and `gap-5`.
- Detail/workflow pages should use the default top-aligned content; the main entry page may opt into vertical centering with `contentPlacement="center"`.
- Page labels and titles are part of `AppPageShell`; pass the page title through its `title` prop and use the default label unless there is a product reason not to.
- If a page needs a deliberate exception, add an explicit opt-in prop to `AppPageShell` instead of duplicating container or header classes.
