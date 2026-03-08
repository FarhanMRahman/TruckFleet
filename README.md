# TruckFleet

Fleet management and dispatch platform for chemical and hazardous material transport.

TruckFleet is a purpose-built logistics platform designed for biochemical companies that need to manage truck fleets, dispatch chemical loads safely, track drivers in real time, and maintain full regulatory compliance — all from a single web application.

---

## Overview

| | |
|---|---|
| **Target users** | Fleet managers, dispatchers, and truck drivers |
| **Domain** | Chemical & hazardous material transport |
| **Driver app** | Mobile-responsive PWA (no native app required) |
| **Auth** | Email/password + Google OAuth |

### Three roles

| Role | Access |
|------|--------|
| **Admin** | Manage trucks, drivers, chemical load library, user roles |
| **Dispatcher** | Create and assign trips, monitor fleet, manage alerts |
| **Driver** | View assigned trips, update status, access documents, sign POD |

---

## Goals

- **Safety first** — Enforce hazmat certification requirements at dispatch; no uncertified driver can be assigned to a load they are not qualified for
- **Operational efficiency** — Smart filtering shows only eligible drivers and trucks for each chemical load
- **Real-time visibility** — Live GPS map for dispatchers; ETA tracking; offline and delay alerts
- **Compliance built-in** — Digital pre/post-trip inspections, hours-of-service logging, and signed proof of delivery replace paper-based processes

---

## Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL + Drizzle ORM |
| Auth | BetterAuth (email/password + Google OAuth) |
| Map | Leaflet + OpenStreetMap (Phase 4) |
| Real-time | Server-Sent Events (Phase 4) |
| File storage | Local filesystem (dev) / Vercel Blob (prod) |
| Mobile | Progressive Web App (Phase 3) |
| Package manager | pnpm |

---

## Codebase Architecture

```
src/
├── app/
│   ├── (admin)/               # Admin-only pages (role guard: admin)
│   │   ├── layout.tsx         # Sidebar layout
│   │   └── admin/page.tsx     # Admin dashboard
│   ├── (dispatcher)/          # Dispatcher pages (role guard: dispatcher | admin)
│   │   ├── layout.tsx         # Sidebar layout
│   │   └── dispatch/page.tsx  # Dispatch dashboard
│   ├── (driver)/              # Driver pages (role guard: driver)
│   │   ├── layout.tsx         # Mobile layout + bottom nav
│   │   └── driver/page.tsx    # Driver home
│   ├── (auth)/                # Sign-in, sign-up, password reset
│   ├── api/
│   │   └── auth/[...all]/     # BetterAuth API handler
│   ├── dashboard/page.tsx     # Role router — redirects by role
│   └── page.tsx               # Public landing page
│
├── components/
│   ├── layouts/
│   │   ├── admin-nav.tsx          # Admin sidebar navigation
│   │   ├── dispatcher-nav.tsx     # Dispatcher sidebar navigation
│   │   └── driver-bottom-nav.tsx  # Driver bottom navigation bar
│   ├── auth/                  # Sign-in button, sign-up form, user profile
│   └── ui/                    # shadcn/ui primitives
│
├── lib/
│   ├── schema.ts              # All Drizzle table definitions
│   ├── auth.ts                # BetterAuth server config
│   ├── auth-client.ts         # BetterAuth client hooks
│   ├── session.ts             # requireAuth(), requireRole() helpers
│   ├── db.ts                  # Drizzle database connection
│   ├── env.ts                 # Zod environment variable validation
│   └── storage.ts             # File upload abstraction (local / Vercel Blob)
│
└── scripts/
    └── seed.ts                # Seeds sample trucks and chemical loads
```

### Database Schema

| Table | Purpose |
|-------|---------|
| `user` | BetterAuth users + `role` field (admin / dispatcher / driver) |
| `session` | BetterAuth sessions |
| `account` | OAuth provider accounts |
| `trucks` | Fleet vehicles (name, plate, type, status) |
| `drivers` | Driver profiles linked to users (license, certifications, status) |
| `chemical_loads` | Chemical load definitions (hazard class, UN number, required vehicle + certs) |
| `trips` | Dispatch records linking truck + driver + load (full lifecycle) |

### Role-based routing

```
/dashboard     →  reads session role → redirects to role home
/admin/**      →  requireRole(["admin"])
/dispatch/**   →  requireRole(["dispatcher", "admin"])
/driver/**     →  requireRole(["driver"])
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Docker Desktop (for local PostgreSQL)
- A Google Cloud project with OAuth 2.0 credentials

### 1. Clone and install

```bash
git clone https://github.com/FarhanMRahman/TruckFleet.git
cd TruckFleet
pnpm install
```

### 2. Configure environment

Edit `.env` with the required values:

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | Random 32+ char secret |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL (default: `http://localhost:3000`) |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob token (production only) |

Google OAuth callback URL to register in Google Cloud Console:
```
http://localhost:3000/api/auth/callback/google
```

### 3. Start the database

Port `5433` is used to avoid conflict with any local PostgreSQL on `5432`.

```bash
docker compose up -d
```

### 4. Run migrations

```bash
pnpm db:migrate
```

### 5. Seed sample data

```bash
pnpm db:seed
```

Inserts 5 sample trucks and 5 chemical loads.

### 6. Start the dev server

```bash
pnpm dev
```

Open http://localhost:3000.

### 7. Set your role

After signing in, your account defaults to the `driver` role. To change it:

```bash
pnpm db:studio
```

Open https://local.drizzle.studio, find your user in the `user` table, and set `role` to `admin`, `dispatcher`, or `driver`.

---

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build (runs migrations first) |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Seed sample trucks and chemical loads |
| `pnpm db:studio` | Open Drizzle Studio (DB browser) |

---

## Branch and PR Strategy

| Scope | Branch | Merges into |
|-------|--------|-------------|
| Phase 0 (foundation) | `phase-0` | `master` |
| Phase 1+ individual features | `feature/<name>` | `master` |

Each feature branch maps to a GitHub Issue. PRs reference their issue and go through review before merging.

See the [project board](https://github.com/users/FarhanMRahman/projects/1) for all open work items.

---

## Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 0** | Foundation — schema, auth, role layouts, seed data | Complete |
| **Phase 1** | Admin CRUD — trucks, drivers, chemical loads | Next |
| **Phase 2** | Dispatch — trip creation, assignment, fleet board | Planned |
| **Phase 3** | Driver mobile PWA — trips, docs, messaging | Planned |
| **Phase 4** | Real-time fleet map — Leaflet, GPS, SSE, alerts | Planned |
| **Phase 5** | Compliance — inspections, HOS, proof of delivery | Planned |

Full details in [PLAN.md](./PLAN.md).

