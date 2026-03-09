# Developer Guide

## Overview

This guide covers the full workflow for contributing to TruckFleet — from picking up a work item to getting it merged into `master`.

---

## Branch Protection Rules

`master` is a protected branch. The following are enforced:

- All changes must go through a Pull Request — no direct pushes
- At least **1 approving review** is required before merge
- The CI/CD pipeline must pass before merge
- Stale reviews are dismissed when new commits are pushed

---

## Workflow

### 1. Pick a Work Item

All work items (bugs and enhancements) are tracked as GitHub Issues.

- Browse open issues at: `https://github.com/FarhanMRahman/TruckFleet/issues`
- Assign yourself to the issue before starting work
- Every PR must be linked to an open issue — do not open a PR without a corresponding issue

If no issue exists for the work you want to do, create one first and label it appropriately (`bug` or `enhancement`).

---

### 2. Create a Branch

Branch off `master` using a consistent naming convention:

```bash
git checkout master
git pull origin master
git checkout -b <type>/<short-description>
```

**Branch naming:**

| Type | Prefix | Example |
|------|--------|---------|
| Bug fix | `fix/` | `fix/notification-navigation` |
| Feature / enhancement | `feat/` | `feat/unit-tests` |
| Chore / cleanup | `chore/` | `chore/remove-env-example` |
| Docs | `docs/` | `docs/dev-guide` |

---

### 3. Make Your Changes

- Keep changes focused on the linked issue — avoid unrelated edits
- Follow the existing code patterns and file structure (see `CLAUDE.md`)
- Run lint and type checks locally before pushing:

```bash
pnpm lint
pnpm typecheck
```

- If your change touches logic that can be unit tested, add tests (see [Testing](#testing))

---

### 4. Open a Pull Request

Push your branch and open a PR against `master`:

```bash
git push -u origin <your-branch>
```

**PR requirements:**

- Title should be short and descriptive (under 70 characters)
- Body must include:
  - A summary of what changed and why
  - A reference to the linked issue using `Closes #<issue-number>` — this auto-closes the issue on merge
  - A test plan (steps to verify the change works)

**PR body template:**

```markdown
## Summary
- <what changed>
- <why it was needed>

## Linked Issue
Closes #<issue-number>

## Test Plan
- [ ] <step to verify>
- [ ] <step to verify>
```

---

### 5. CI/CD Pipeline

On every PR, the pipeline runs automatically and must pass before merging. It checks:

- **Build** — `pnpm build:ci` (no DB required)
- **Lint** — `pnpm lint`
- **Type check** — `pnpm typecheck`

If any check fails, fix the issue and push again. Do not bypass failing checks.

---

### 6. Code Review & Approval

- At least **1 approving review** is required
- Address all review comments before merging
- Once approved and all checks pass, the PR can be merged

---

### 7. Merge & Cleanup

Use **"Merge commit"** (default) when merging. After merge:

```bash
git checkout master
git pull origin master
git branch -d <your-branch>
```

The linked issue will be closed automatically on merge if `Closes #<n>` was included in the PR body.

---

## Testing

Tests are optional but encouraged, especially for:

- Utility functions and helpers
- API route logic
- Complex UI interactions

```bash
pnpm test          # run unit tests (when configured)
pnpm test:e2e      # run E2E tests (when configured)
```

When adding tests, place them alongside the file they cover:

```
src/lib/utils.ts
src/lib/utils.test.ts
```

---

## Local Development Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start the database
/Applications/Docker.app/Contents/Resources/bin/docker compose up -d

# 3. Apply migrations
pnpm db:migrate

# 4. (Optional) Seed sample data
pnpm db:seed

# 5. Start the dev server
pnpm dev
```

The app runs at `http://localhost:3000`.

Environment variables are in `.env`. See `CLAUDE.md` for the full list of required variables.

---

## Quick Reference

```bash
pnpm dev           # start dev server
pnpm lint          # run ESLint
pnpm typecheck     # TypeScript check
pnpm build:ci      # production build (no DB)
pnpm db:generate   # generate migrations after schema changes
pnpm db:migrate    # apply migrations
pnpm db:seed       # seed sample data
pnpm db:studio     # open Drizzle Studio (DB GUI)
```
