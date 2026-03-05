# TruckFleet — Phased Implementation Plan

## Overview
TruckFleet is a trucking logistics platform for chemical/hazardous material transport. It serves three roles: **Admin**, **Dispatcher**, and **Driver**. The driver-facing experience is a mobile-responsive PWA (no native app needed for MVP).

**Auth:** Google OAuth + email/password sign-in. BetterAuth handles both with `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` for Google.

---

## Phase 0 — Foundation & Role-Based Setup
**Goal:** Get the app running and establish the data model and role system that every future phase depends on.

### Tasks
- [x] Create `PLAN.md` in the repo root
- [x] Install dependencies (`pnpm install`)
- [x] Start Docker Postgres (`docker compose up -d`) — runs on port **5433** (5432 is taken by local Postgres)
- [x] Configure BetterAuth with both Google OAuth and email/password — sign-in/sign-up pages keep email/password forms + "Sign in with Google" button
- [x] Extend DB schema:
  - `users` → added `role` field (admin | dispatcher | driver, default: driver)
  - `trucks` (id, name, plate, type, status)
  - `drivers` (id, user_id, certifications[], license_number, status)
  - `chemical_loads` (id, name, hazard_class, un_number, required_vehicle_type, required_certifications[])
  - `trips` (id, truck_id, driver_id, load_id, status, origin, destination, scheduled_at, etc.)
- [x] Role-based protected routes (admin, dispatcher, driver)
- [x] Responsive shell layout with role-specific nav (Admin/Dispatcher sidebar, Driver bottom-nav)
- [x] Seed script with sample data (5 trucks, 5 chemical loads)
- [x] Remove AI chat boilerplate (chat page, chat API route)
- [x] Run migrations

### Verification
- App runs at `localhost:3000`
- Google sign-in works
- All 3 roles redirect to their correct dashboards
- DB schema is live (`pnpm db:studio` to inspect)

> **Checkpoint:** `/checkpoint` to GitHub after verification.

---

## Phase 1 — Core Data Management (Admin)
**Goal:** Admin can manage the fleet catalog — trucks, driver profiles, and chemical load definitions.

### Tasks
- [ ] Truck management: CRUD (add/edit/deactivate, assign vehicle type)
- [ ] Driver profiles: CRUD (name, license, certifications: HazMat, TWIC, etc., status)
- [ ] Chemical load library: define chemical types with hazard class, UN number, required vehicle type, required driver certifications
- [ ] Cert validation: dispatch-blocking rules (driver lacks cert for load's hazard class)
- [ ] Table/list UIs with shadcn/ui DataTable

### Verification
- Admin can create, edit, and delete trucks, drivers, and chemical loads
- Cert validation blocks invalid combinations at the form level

> **Checkpoint:** `/checkpoint` to GitHub after verification.

---

## Phase 2 — Dispatch Dashboard & Trip Management
**Goal:** Dispatchers can create trips, assign drivers/trucks, and manage the trip lifecycle.

### Tasks
- [ ] Trip creation form: select load → auto-filters eligible trucks + certified drivers
- [ ] Trip lifecycle: `draft → assigned → in_progress → delivered → cancelled`
- [ ] Fleet availability board: free vs. on-shift trucks/drivers
- [ ] Dispatcher dashboard: active trips list, upcoming trips, status badges
- [ ] Hard block: cannot assign uncertified driver to hazardous load
- [ ] In-app notification to driver on trip assignment

### Verification
- Dispatcher creates a trip, assigns a driver + truck
- Driver sees the assignment in their dashboard

> **Checkpoint:** `/checkpoint` to GitHub after verification.

---

## Phase 3 — Driver Mobile App
**Goal:** Drivers have a mobile-first web experience to manage their assigned work.

### Tasks
- [ ] Driver home: today's trip card, next trip, current status
- [ ] Trip detail: pickup/dropoff info, load details (hazard class, handling notes), navigation deep-link (Google Maps / Apple Maps)
- [ ] Driver status updates: Available → On Shift → Driving → Delivering
- [ ] MSDS / manifest document viewer (PDFs attached to chemical loads)
- [ ] Basic dispatcher ↔ driver messaging (thread per trip, polling-based)
- [ ] PWA config (manifest + service worker) so drivers can install to home screen

### Verification
- Open driver view on a mobile browser
- Accept a trip, update status, view MSDS, send a message to dispatcher

> **Checkpoint:** `/checkpoint` to GitHub after verification.

---

## Phase 4 — Real-Time Fleet Tracking
**Goal:** Live map view for dispatchers showing truck locations and statuses.

### Tasks
- [ ] Driver app: GPS capture via browser Geolocation API, sent to server via periodic POST
- [ ] `truck_locations` table: (truck_id, lat, lng, heading, recorded_at)
- [ ] Dispatch map dashboard: Leaflet + OpenStreetMap (free, no API key) with truck pins
- [ ] Truck pins: driver name, status, load, ETA estimate
- [ ] Offline alert: flag trucks with no ping in > 10 min
- [ ] Delay alert: ETA significantly past scheduled delivery window
- [ ] SSE stream from server → dispatch dashboard for live updates

### Verification
- Driver opens app on phone → dispatcher sees truck pin move on map in real time
- Offline alert triggers after 10 min of no ping

> **Checkpoint:** `/checkpoint` to GitHub after verification.

---

## Phase 5 — Compliance & Proof of Delivery
**Goal:** Capture all regulatory and delivery documentation digitally.

### Tasks
- [ ] Pre-trip inspection: checklist form (brakes, lights, placard, load securing) — required gate before "Start Trip" unlocks
- [ ] Post-trip inspection: similar form required to mark trip complete
- [ ] Hours-of-service logging: shift start/end, driving time per trip, cumulative weekly hours
- [ ] Proof of delivery: signature capture (canvas), timestamp, optional photo upload
- [ ] Compliance doc auto-attachment: SDS/MSDS and shipping manifest auto-linked to trip on creation
- [ ] Compliance summary view for dispatcher (inspection status, HOS flags)

### Verification
- Driver completes pre-trip checklist → starts trip → delivers → signs POD → completes post-trip
- Dispatcher sees full compliance trail

> **Checkpoint:** `/checkpoint` to GitHub after verification.

---

## Tech Stack
| Concern | Choice |
|---------|--------|
| Framework | Next.js 16 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | PostgreSQL + Drizzle ORM |
| Auth | BetterAuth (Google OAuth only) |
| Map | Leaflet + OpenStreetMap (free) |
| Real-time | SSE (built into Next.js) |
| File storage | Local (dev) / Vercel Blob (prod) — boilerplate abstraction |
| Mobile | PWA (added in Phase 3) |
| Package manager | pnpm |

## Key Files
- `src/lib/schema.ts` — all DB tables
- `src/lib/auth.ts` — Google OAuth config
- `src/lib/env.ts` — environment variable validation
- `src/app/(auth)/` — sign-in page
- `docker-compose.yml` — PostgreSQL setup
- `drizzle/` — migration files
- `PLAN.md` — this file
