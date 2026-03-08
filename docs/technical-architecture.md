# TruckFleet — Technical Architecture

---

## Overview

TruckFleet is a web-based logistics platform for hazardous materials transport. It is built as a server-rendered Next.js application with role-based access control, real-time fleet tracking, and compliance document management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| Database | PostgreSQL 15 via Docker |
| ORM | Drizzle ORM |
| Authentication | BetterAuth (email/password + Google OAuth) |
| UI components | shadcn/ui (Radix UI primitives + Tailwind CSS 4) |
| Maps | Leaflet + OpenStreetMap (no API key required) |
| Real-time | Server-Sent Events (SSE) built into Next.js |
| File storage | Local filesystem (dev) / Vercel Blob (production) — abstracted via `src/lib/storage.ts` |
| Package manager | pnpm |

---

## Repository Structure

```
TruckFleet/
├── src/
│   ├── app/                        # Next.js App Router pages and API routes
│   │   ├── (admin)/                # Admin-only pages (role guard: admin)
│   │   │   └── admin/
│   │   │       ├── page.tsx        # Admin dashboard
│   │   │       ├── trucks/         # Truck CRUD
│   │   │       ├── drivers/        # Driver CRUD
│   │   │       └── loads/          # Chemical load CRUD + SDS management
│   │   ├── (dispatcher)/           # Dispatcher pages (role guard: dispatcher | admin)
│   │   │   └── dispatch/
│   │   │       ├── page.tsx        # Dispatcher dashboard
│   │   │       ├── trips/          # Trip management
│   │   │       ├── map/            # Live fleet map (Leaflet)
│   │   │       ├── fleet/          # Fleet availability board
│   │   │       ├── messages/       # Messages hub
│   │   │       ├── documents/      # SDS document viewer
│   │   │       ├── hos/            # HOS monitoring
│   │   │       └── alerts/         # Alert feed
│   │   ├── (driver)/               # Driver pages (role guard: driver)
│   │   │   └── driver/
│   │   │       ├── page.tsx        # Driver home
│   │   │       ├── trips/          # Trip list + detail
│   │   │       ├── messages/       # Message threads
│   │   │       ├── documents/      # SDS viewer
│   │   │       └── hos/            # HOS log
│   │   ├── (auth)/                 # Login / Register / Password reset
│   │   ├── dashboard/page.tsx      # Role router (redirects to role-specific home)
│   │   └── api/                    # API Route Handlers
│   ├── components/
│   │   ├── layouts/                # Role-specific nav components
│   │   │   ├── admin-nav.tsx
│   │   │   ├── dispatcher-nav.tsx
│   │   │   └── driver-bottom-nav.tsx
│   │   ├── notifications-bell.tsx  # Notification dropdown
│   │   ├── admin/                  # Admin-specific components (modals, tables)
│   │   └── ui/                     # shadcn/ui primitives
│   └── lib/
│       ├── schema.ts               # Drizzle schema — all database tables
│       ├── db.ts                   # Drizzle database connection
│       ├── auth.ts                 # BetterAuth server config
│       ├── auth-client.ts          # BetterAuth client hooks
│       ├── session.ts              # requireAuth() / requireRole() helpers
│       ├── storage.ts              # File upload abstraction
│       └── notifications.ts        # createDedupedNotifications() helper
├── scripts/
│   └── seed.ts                     # Demo data seeder
├── drizzle/
│   └── migrations/                 # Auto-generated SQL migrations
├── .github/workflows/              # CI/CD pipelines
│   ├── build-validation.yml
│   ├── code-format-validation.yml
│   └── test-validation.yml
└── docs/                           # Project documentation
```

---

## Database Schema

All tables use PostgreSQL. BetterAuth tables use text IDs; domain tables auto-generate UUIDs via `crypto.randomUUID()`.

### BetterAuth Tables (managed by BetterAuth)

| Table | Purpose |
|---|---|
| `user` | User accounts (extended with `role` field) |
| `session` | Active sessions with token + expiry |
| `account` | Auth providers per user (credential, google) |
| `verification` | Email verification / password reset tokens |

### Domain Tables

#### `trucks`
| Column | Type | Notes |
|---|---|---|
| id | text PK | UUID |
| name | text | Display name |
| plate | text UNIQUE | License plate |
| type | text | `tanker` \| `hazmat` \| `flatbed` \| `refrigerated` |
| status | text | `available` \| `on_trip` \| `maintenance` \| `inactive` |

#### `drivers`
| Column | Type | Notes |
|---|---|---|
| id | text PK | UUID |
| userId | text FK → user.id | One driver profile per user |
| licenseNumber | text | CDL number |
| certifications | text[] | e.g. `["hazmat","tanker","twic"]` |
| status | text | `available` \| `on_shift` \| `driving` \| `delivering` \| `off_duty` |

#### `chemical_loads`
| Column | Type | Notes |
|---|---|---|
| id | text PK | UUID |
| name | text | e.g. "Gasoline (Regular)" |
| hazardClass | text | DOT classification, e.g. `"3"` |
| unNumber | text | e.g. `"UN1203"` |
| requiredVehicleType | text | Must match `trucks.type` |
| requiredCertifications | text[] | Must be subset of driver's certifications |
| handlingNotes | text | Safety instructions |
| sdsDocumentUrl | text | URL to uploaded SDS PDF |

#### `trips`
| Column | Type | Notes |
|---|---|---|
| id | text PK | UUID |
| truckId | text FK → trucks.id | Nullable (unassigned draft) |
| driverId | text FK → drivers.id | Nullable (unassigned draft) |
| loadId | text FK → chemical_loads.id | |
| status | text | `draft` \| `assigned` \| `in_progress` \| `delivered` \| `cancelled` |
| origin | text | Pickup location |
| destination | text | Delivery location |
| scheduledAt | timestamp | Planned departure |
| startedAt | timestamp | Actual departure |
| deliveredAt | timestamp | Delivery timestamp |
| notes | text | Dispatcher notes |
| createdBy | text FK → user.id | |

#### `truck_locations`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| truckId | text FK → trucks.id | |
| driverId | text FK → drivers.id | |
| lat | double precision | WGS84 latitude |
| lng | double precision | WGS84 longitude |
| heading | double precision | Degrees 0–360 |
| speed | double precision | km/h |
| recordedAt | timestamp | Client-side timestamp |

#### `messages`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| tripId | text FK → trips.id | |
| senderId | text FK → user.id | |
| senderName | text | Denormalised for display |
| content | text | Message body |
| createdAt | timestamp | |

#### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| userId | text FK → user.id | Recipient |
| type | text | `trip_assigned` \| `trip_updated` \| `trip_cancelled` \| `sds_uploaded` |
| message | text | Human-readable message |
| tripId | text FK → trips.id | Optional |
| actionUrl | text | Optional URL (e.g. SDS PDF link) |
| read | boolean | Default false |
| createdAt | timestamp | |

#### `proof_of_deliveries`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| tripId | text UNIQUE FK → trips.id | One POD per trip |
| driverId | text FK → drivers.id | |
| signatureDataUrl | text | Base64 PNG data URL |
| signedAt | timestamp | |
| notes | text | Optional |

#### `trip_inspections`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| tripId | text FK → trips.id | |
| driverId | text FK → drivers.id | |
| type | text | `pre` \| `post` |
| items | json | `{ item: string; checked: boolean }[]` |
| completedAt | timestamp | |

#### `hos_logs`
| Column | Type | Notes |
|---|---|---|
| id | text PK | |
| driverId | text FK → drivers.id | |
| tripId | text FK → trips.id | Null for shift records |
| type | text | `shift` \| `driving` |
| shiftStart | timestamp | |
| shiftEnd | timestamp | Null if shift is open |
| drivingMinutes | integer | Populated when type = `driving` |

---

## API Route Structure

All API routes live under `src/app/api/` and follow Next.js App Router Route Handler conventions.

### Admin Routes (require `admin` role)
| Route | Methods | Description |
|---|---|---|
| `/api/admin/trucks` | GET, POST | List / create trucks |
| `/api/admin/trucks/[id]` | PATCH, DELETE | Update / delete truck |
| `/api/admin/drivers` | GET, POST | List / create driver profiles |
| `/api/admin/drivers/[id]` | PATCH, DELETE | Update / delete driver profile |
| `/api/admin/chemical-loads` | GET, POST | List / create chemical loads |
| `/api/admin/chemical-loads/[id]` | PATCH, DELETE | Update / delete load |
| `/api/admin/chemical-loads/[id]/document` | POST, DELETE | Upload / remove SDS PDF |
| `/api/admin/users/without-driver` | GET | Users not yet linked to a driver profile |

### Dispatcher Routes (require `dispatcher` or `admin` role)
| Route | Methods | Description |
|---|---|---|
| `/api/dispatch/dashboard` | GET | Summary stats (active trips, availability, alerts) |
| `/api/dispatch/trips` | GET, POST | List all trips / create trip |
| `/api/dispatch/trips/[id]` | GET, PATCH, DELETE | Trip detail / update / cancel |
| `/api/dispatch/trips/[id]/inspections` | GET | Inspection records for a trip |
| `/api/dispatch/trips/[id]/pod` | GET | Proof of delivery for a trip |
| `/api/dispatch/fleet` | GET | All trucks + drivers with current status |
| `/api/dispatch/eligible-resources` | GET | Eligible trucks/drivers for a given load |
| `/api/dispatch/locations` | GET | Latest truck location per truck |
| `/api/dispatch/locations/stream` | GET | SSE stream of real-time location updates |
| `/api/dispatch/messages` | GET | All trips with message summaries |
| `/api/dispatch/alerts` | GET | Active alerts (late, offline, missing inspection) |
| `/api/dispatch/hos` | GET | HOS logs for all drivers |

### Driver Routes (require `driver` role, scoped to current user's driver profile)
| Route | Methods | Description |
|---|---|---|
| `/api/driver/home` | GET | Today's trip + upcoming trip |
| `/api/driver/trips` | GET | All trips for current driver |
| `/api/driver/trips/[id]` | GET | Trip detail |
| `/api/driver/trips/[id]/status` | PATCH | Update trip status |
| `/api/driver/trips/[id]/inspection` | POST | Submit pre/post inspection |
| `/api/driver/trips/[id]/pod` | POST | Submit proof of delivery |
| `/api/driver/status` | PATCH | Update driver status |
| `/api/driver/location` | POST | Post GPS coordinates |
| `/api/driver/messages` | GET | All trip conversations for this driver |
| `/api/driver/documents` | GET | Trips + SDS URLs for this driver |
| `/api/driver/hos` | GET | HOS logs for this driver |

### Shared Routes
| Route | Methods | Description |
|---|---|---|
| `/api/auth/[...all]` | ALL | BetterAuth handler (sign-in, sign-up, OAuth, etc.) |
| `/api/notifications` | GET | Unread notifications for current user |
| `/api/notifications/[id]/read` | PATCH | Mark notification as read |
| `/api/trips/[id]/messages` | GET, POST | Read / send messages on a trip |

---

## Authentication & Authorization

### BetterAuth Configuration (`src/lib/auth.ts`)
- Email/password provider with scrypt password hashing
- Google OAuth provider
- Session stored in the `session` table with a secure token

### Session Helpers (`src/lib/session.ts`)
```typescript
requireAuth()             // → { session } or redirects to /login
requireRole(roles[])      // → { session } if role matches, else 403/redirect
```

All API routes call `requireRole()` at the top — unauthorized requests receive a `403` JSON response.

### Role Routing (`/dashboard`)
After sign-in, BetterAuth redirects to `/dashboard`. That page reads the user's role and redirects:
- `admin` → `/admin`
- `dispatcher` → `/dispatch`
- `driver` → `/driver`

---

## Real-Time Architecture

### GPS Location Updates (Driver → Server)
- Driver app uses the browser Geolocation API
- Sends a POST to `/api/driver/location` every 30 seconds while on an active trip
- Each ping is inserted into `truck_locations`

### Live Map Updates (Server → Dispatcher)
- Dispatcher map page connects to `/api/dispatch/locations/stream` (SSE)
- Server queries latest location per truck every 5 seconds and streams as JSON events
- No WebSocket infrastructure required — Next.js Route Handlers support SSE natively

---

## File Storage

Abstracted via `src/lib/storage.ts`:

```typescript
upload(buffer: Buffer, filename: string, folder: string) → { url: string }
deleteFile(url: string) → void
```

- **Development**: files saved to `public/uploads/[folder]/`, served at `/uploads/[folder]/[filename]`
- **Production**: files uploaded to Vercel Blob, `BLOB_READ_WRITE_TOKEN` env var must be set

SDS PDFs are stored under `sds/` folder. URLs are saved to `chemical_loads.sds_document_url`.

---

## CI/CD Pipelines

Three GitHub Actions workflows in `.github/workflows/`:

### Build Validation (`build-validation.yml`)
- Trigger: push and pull_request to `master`
- Steps: checkout → pnpm install → `pnpm build:ci`
- Uses dummy env vars (no real DB needed for CI build)

### Code Format Validation (`code-format-validation.yml`)
- Trigger: push and pull_request to `master`
- Steps: checkout → pnpm install → `pnpm lint` → `pnpm typecheck`

### Test Validation (`test-validation.yml`)
- Trigger: push and pull_request to `master`
- Unit tests: runs if `vitest.config.*` exists → `pnpm test --run`
- E2E tests: runs if `playwright.config.*` exists → `pnpm exec playwright test`

**Branch protection on `master`:** all three checks must pass; direct pushes to `master` require a passing PR.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `POSTGRES_URL` | Yes | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | 32+ character random secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL of the app |
| `GOOGLE_CLIENT_ID` | OAuth | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth | Google OAuth client secret |
| `OPENROUTER_API_KEY` | No | AI features (not used in current build) |
| `BLOB_READ_WRITE_TOKEN` | Production | Vercel Blob token for file storage |

---

## Local Development Setup

```bash
# 1. Start database
/Applications/Docker.app/Contents/Resources/bin/docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Apply migrations
pnpm db:migrate

# 4. Seed demo data
pnpm db:seed

# 5. Start dev server
pnpm dev
```

Database runs on **port 5433** (Docker) to avoid conflict with a local Postgres instance on 5432.

```
POSTGRES_URL=postgresql://dev_user:dev_password@localhost:5433/postgres_dev
```

### Demo Accounts (after seed)
| Role | Email | Password |
|---|---|---|
| Admin | admin@truckfleet.demo | Demo1234! |
| Dispatcher | dispatch@truckfleet.demo | Demo1234! |
| Driver 1 | driver1@truckfleet.demo | Demo1234! |
| Driver 2 | driver2@truckfleet.demo | Demo1234! |
| Driver 3 | driver3@truckfleet.demo | Demo1234! |
