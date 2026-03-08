# TruckFleet — Demo Guide

This guide walks you through running a live demo of TruckFleet using an **isolated demo database** so your real development data is never touched.

---

## One-Time Setup

Run these once before your first demo.

### 1. Start Docker
```bash
/Applications/Docker.app/Contents/Resources/bin/docker compose up -d
```

### 2. Create and migrate the demo database
```bash
pnpm demo:init
```
This creates a separate `postgres_demo` database inside the same Docker container and applies all migrations to it. Your `postgres_dev` data is untouched.

### 3. Seed demo data
```bash
pnpm demo:seed
```
Populates the demo database with:
- 5 user accounts (admin, dispatcher, 3 drivers)
- 6 trucks across all statuses
- 6 chemical loads with hazard classes and UN numbers
- 5 trips across all lifecycle states (draft → delivered)
- Messages on active trips
- Pre/post inspections and proof of delivery on the completed trip
- Simulated GPS coordinates for trucks in transit

**Demo credentials — all use password `Demo1234!`**

| Role | Email |
|---|---|
| Admin | admin@truckfleet.demo |
| Dispatcher | dispatch@truckfleet.demo |
| Driver 1 | driver1@truckfleet.demo |
| Driver 2 | driver2@truckfleet.demo |
| Driver 3 | driver3@truckfleet.demo |

---

## Starting the Demo

```bash
pnpm demo:start
```

This copies `.env.demo` to `.env.local` (which overrides `.env`) and starts the dev server pointing at `postgres_demo`. Open **http://localhost:3000**.

---

## Demo Walkthrough (~15 min)

Use **three browser windows** side by side for maximum effect.

---

### Window 1 — Admin (`admin@truckfleet.demo`)

**Chemical Loads → `/admin/loads`**
- Show the load library: hazard classes, UN numbers, required certifications
- Open a load → click Edit → scroll to SDS Document section → upload a PDF
- Point out: a notification fires to the dispatcher window in real time

**Trucks → `/admin/trucks`**
- Show the fleet list with status badges (Available, On Trip, Maintenance)
- Edit a truck — change its type or status

**Drivers → `/admin/drivers`**
- Show certifications (HazMat, TWIC, Tanker, etc.)
- Explain that these gate which loads a driver can be assigned to

---

### Window 2 — Dispatcher (`dispatch@truckfleet.demo`)

**Dashboard → `/dispatch`**
- Summary cards: active trips, trucks available, drivers available, alerts
- Show the notification bell — it received the SDS upload from the admin window

**Trips → `/dispatch/trips`**
- Filter by status to show all lifecycle stages
- Open the in-progress trip — show load info, driver, truck, compliance data
- **Create a new trip:**
  - Select a chemical load
  - Show that the driver dropdown only shows certified drivers
  - Show that the truck dropdown only shows compatible vehicle types
  - Save as draft or assign immediately

**Live Map → `/dispatch/map`**
- Truck pins on OpenStreetMap at real Texas highway coordinates
- Show driver name, load, and status on each pin

**Fleet Board → `/dispatch/fleet`**
- At-a-glance availability of every truck and driver

**Messages → `/dispatch/messages`**
- Open a trip thread — send a message to the driver
- Switch to Window 3 to show it arrive

---

### Window 3 — Driver on mobile (`driver1@truckfleet.demo`)

> Open this in your phone browser or use Chrome DevTools device emulation

**Home → `/driver`**
- Today's trip card with origin, destination, chemical name
- Status buttons (Available / On Shift / Driving / Delivering)

**Trip Detail → `/driver/trips/[id]`**
- Hazard class, UN number, handling notes
- Navigate button → deep-links to Google Maps / Apple Maps
- Pre-trip inspection checklist → submit → Start Trip button unlocks
- Send a message to dispatcher → confirm it appears in Window 2

**Documents → `/driver/documents`**
- Show the SDS PDF link from the admin upload in Window 1
- Tap to open the PDF

**Install as PWA (bonus)**
- Safari on iPhone: Share → Add to Home Screen
- Show the home screen icon and bottom navigation

---

## Resetting Between Demos

To restore the database to a clean state at any time:
```bash
pnpm demo:seed
```

This wipes all domain data and re-inserts the full demo dataset. Takes ~5 seconds.

---

## Stopping the Demo

```bash
# Stop the dev server (Ctrl+C), then:
pnpm demo:stop
```

This removes `.env.local`, switching the app back to your real `postgres_dev` database. Run `pnpm dev` as normal after this.

---

## Tips

- **SDS upload + notification** is the most impressive live interaction — do this early with both windows visible
- **Messages** between dispatcher and driver windows shows the real-time feel
- **Trip creation with cert filtering** is a key differentiator — show the dropdown only populating valid drivers after selecting a load
- **Mobile PWA install** is a strong finish for showing the driver experience
- If anything looks broken, `pnpm demo:seed` resets everything in seconds
