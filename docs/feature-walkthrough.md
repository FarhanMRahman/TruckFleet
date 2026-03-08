# TruckFleet — Feature Walkthrough

A complete reference of all features available in TruckFleet, organized by role.

---

## Authentication

| Feature | Details |
|---|---|
| Email / Password sign-in | Standard credentials sign-in at `/login` |
| Google OAuth | One-click sign-in with Google account |
| Role-based redirect | After login, users are sent to their role-specific dashboard |
| Forgot / Reset password | Self-service password reset via email link |

New accounts default to the **Driver** role. An admin can change roles via the admin UI or Drizzle Studio.

---

## Admin Role — `/admin`

### Truck Management (`/admin/trucks`)
- View all trucks in a sortable list with status badges (Available, On Trip, Maintenance, Inactive)
- **Add truck** — name, license plate, vehicle type (Tanker / HazMat / Flatbed / Refrigerated)
- **Edit truck** — update any field inline via modal
- **Deactivate / delete truck** — soft status change or full removal
- Status automatically updates when a truck is assigned to or released from a trip

### Driver Management (`/admin/drivers`)
- View all driver profiles with their certifications and current status
- **Add driver profile** — links a user account to a CDL license number and certification set
- **Edit driver** — update certifications, license number, status
- **Delete driver** — removes profile (user account is preserved)
- Certification options: HazMat, TWIC, Tanker, Acid, Compressed Gas, Explosives Precursor, and more

### Chemical Load Library (`/admin/loads`)
- Define the catalog of chemical/hazardous materials the fleet transports
- Each load specifies:
  - **Name** — e.g. "Gasoline (Regular)"
  - **Hazard Class** — DOT classification (e.g. Class 3 — Flammable Liquids)
  - **UN Number** — international identification (e.g. UN1203)
  - **Required Vehicle Type** — which truck type can carry this load
  - **Required Certifications** — which driver certifications are mandatory
  - **Handling Notes** — free-text safety instructions
  - **SDS Document** — upload a PDF Safety Data Sheet (PDF, max 10 MB)
- Admin can upload or replace the SDS PDF directly from the load card
- On SDS upload, **dispatchers and assigned drivers are notified** with a link to open the PDF

---

## Dispatcher Role — `/dispatch`

### Dashboard (`/dispatch`)
- Summary cards: active trips count, trucks available, drivers available, alerts count
- Recent alerts panel (e.g. late deliveries, no GPS ping)
- Quick links to trips and fleet board

### Trip Management (`/dispatch/trips`)
- Full list of all trips with status filter (Draft / Assigned / In Progress / Delivered / Cancelled)
- **Create trip** — select origin, destination, scheduled time, load, and notes
  - Load selection auto-filters eligible trucks and drivers based on certifications
  - Validation blocks assigning a driver who lacks the required certifications
- **Edit trip** — reassign driver, truck, or update details
- **Update trip status** — move through the lifecycle: Draft → Assigned → In Progress → Delivered
- **Cancel trip** — marks trip cancelled with optional notes
- Trip detail view shows: load info, driver/truck details, compliance status, messages

### Compliance View (within trip detail)
- Pre-trip and post-trip inspection checklists submitted by the driver
- Hours-of-service (HOS) log entries for the trip's driver
- Proof of delivery: signature image + timestamp

### Fleet Board (`/dispatch/fleet`)
- Real-time status of all trucks and drivers
- Per-truck: name, plate, type, status, assigned driver, current load
- Alerts for trucks offline for >10 minutes

### Live Map (`/dispatch/map`)
- Interactive map (Leaflet + OpenStreetMap) showing all truck positions
- Truck pins display driver name, current load, status
- Map updates in real time via Server-Sent Events (SSE) stream
- Trucks with no GPS ping in >10 minutes shown with offline alert

### Messages Hub (`/dispatch/messages`)
- List of all trip conversations with most recent message and timestamp
- Click any conversation to open the full message thread for that trip

### Documents (`/dispatch/documents`)
- Lists all chemical loads and their SDS document status
- Admin users can upload/replace/delete SDS PDFs directly from this page
- Dispatchers see a read-only view with links to open uploaded PDFs

### HOS Monitoring (`/dispatch/hos`)
- View hours-of-service logs for all drivers
- Flags drivers approaching HOS limits

### Alerts (`/dispatch/alerts`)
- Aggregated alert feed: late deliveries, offline trucks, missing inspections

---

## Driver Role — `/driver`

### Home Screen (`/driver`)
- Today's trip card with origin, destination, load name, and status
- Quick status buttons (Available → On Shift → Driving → Delivering)
- Next upcoming trip preview

### My Trips (`/driver/trips`)
- List of assigned trips (active and historical)
- Tap trip to open detail view

### Trip Detail (`/driver/trips/[id]`)
- **Load info**: chemical name, hazard class, UN number, handling notes
- **Navigation**: deep-link to Google Maps / Apple Maps with destination pre-filled
- **Pre-trip inspection**: checklist (brakes, lights, placards, load securing, PPE, etc.) — must be completed before trip can start
- **Status updates**: button to advance trip status (Start Trip → Mark Delivered)
- **Post-trip inspection**: checklist required to complete a trip
- **Proof of delivery**: signature capture canvas + optional notes — required to mark delivered
- **Messages**: real-time thread with dispatcher for this trip

### Documents (`/driver/documents`)
- Lists all trips with their associated chemical load
- If an SDS PDF has been uploaded, a "View SDS / Safety Data Sheet" button appears
- Drivers are notified in-app when a new SDS is uploaded for a load on their trip

### Messages (`/driver/messages`)
- Aggregated view of all trip message threads
- Tap to open the relevant trip's message thread

### Hours of Service (`/driver/hos`)
- View current shift start time and accumulated driving hours

---

## Notifications

All roles receive in-app notifications via the bell icon in the navigation bar.

| Notification Type | Who receives it |
|---|---|
| Trip assigned | Driver on the trip |
| Trip status updated | Dispatcher who created the trip |
| Trip cancelled | Driver on the trip |
| SDS document uploaded | All dispatchers + driver currently assigned to a trip using that load |

Notifications with a linked document open the PDF directly in a new tab when clicked.

---

## PWA (Progressive Web App)

The driver experience is optimized for mobile and can be installed as a PWA:
- Install prompt on mobile browsers (Chrome, Safari on iOS via "Add to Home Screen")
- Offline-capable shell
- Bottom navigation bar optimized for thumb reach

---

## CI/CD Pipeline

Three GitHub Actions workflows run on every PR and push to `master`:

| Pipeline | What it checks |
|---|---|
| Build Validation | `pnpm build:ci` — full Next.js production build with dummy env vars |
| Code Format Validation | `pnpm lint` + `pnpm typecheck` |
| Test Validation | Unit tests (if vitest config present) + E2E tests (if Playwright config present) |

All three must pass before a branch can be merged to `master` (branch protection enforced).
