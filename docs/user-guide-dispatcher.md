# TruckFleet — Dispatcher User Guide

This guide covers every task a dispatcher can perform in TruckFleet.

---

## Signing In

1. Navigate to the app URL and click **Sign in**.
2. Use your email and password, or **Sign in with Google**.
3. After sign-in you are redirected to the Dispatch Dashboard (`/dispatch`).

---

## Dashboard Overview

**Location:** `/dispatch`

The dashboard gives you a real-time summary of the fleet:

| Card | What it shows |
|---|---|
| Active Trips | Trips currently in progress |
| Trucks Available | Trucks not assigned to any trip |
| Drivers Available | Drivers with status "Available" |
| Alerts | Active alerts requiring attention |

The **Recent Alerts** panel lists items like late deliveries and offline trucks.

---

## Managing Trips

**Location:** Dispatch → Trips (`/dispatch/trips`)

### Creating a Trip
1. Click **New Trip** (top-right).
2. Fill in the form:
   - **Origin** — pickup location (free text)
   - **Destination** — delivery location (free text)
   - **Scheduled Time** — planned departure
   - **Chemical Load** — select from the load library
   - **Notes** — optional instructions
3. After selecting a load, the **Truck** and **Driver** dropdowns are automatically filtered to show only eligible options (correct vehicle type + required certifications).
4. If a driver lacks required certifications for the selected load, they will not appear in the dropdown — this is enforced automatically.
5. You can save as **Draft** (no truck/driver assigned yet) or assign immediately.
6. Click **Save**.

The assigned driver receives an in-app notification when the trip is created with them assigned.

### Updating a Trip
1. Find the trip in the list (use the status filter tabs to narrow down).
2. Click the trip row to open the detail view.
3. Click **Edit** to modify origin, destination, load, driver, truck, or notes.
4. Click **Save**.

### Advancing Trip Status
From the trip detail view:

| From Status | Action | To Status |
|---|---|---|
| Draft | Assign driver + truck → Save | Assigned |
| Assigned | Click **Start Trip** | In Progress |
| In Progress | Driver marks delivered (from driver app) | Delivered |
| Any | Click **Cancel** | Cancelled |

> Dispatchers can manually advance status if needed (e.g. driver is unreachable and trip must be closed).

### Viewing Compliance Information
On the trip detail page, scroll down to see:
- **Pre-trip inspection** — checklist completed by driver before departure
- **Post-trip inspection** — checklist completed by driver on arrival
- **Hours of Service** — driving time log for this trip's driver
- **Proof of Delivery** — signature image with timestamp

---

## Live Fleet Map

**Location:** Dispatch → Map (`/dispatch/map`)

- Shows all trucks with active GPS as pins on an OpenStreetMap map.
- Each pin displays: driver name, load, status.
- Map refreshes automatically via a live data stream.
- Trucks that haven't sent a GPS ping in **>10 minutes** are flagged as offline.

---

## Fleet Availability Board

**Location:** Dispatch → Fleet (`/dispatch/fleet`)

A tabular view of the entire fleet:
- All trucks with their current status, assigned driver, and active load.
- All drivers with their current status and certifications.
- Use this to quickly find available resources before creating a trip.

---

## Messages Hub

**Location:** Dispatch → Messages (`/dispatch/messages`)

- Lists all trip conversations, most recent message first.
- Shows sender name, message preview, and timestamp.
- Click any row to go directly to that trip's message thread.

### Sending a Message
1. Open any trip (from Messages or Trips list).
2. Scroll to the **Messages** section.
3. Type your message and press **Enter** or click **Send**.
4. The driver sees the message immediately.

---

## Documents

**Location:** Dispatch → Documents (`/dispatch/documents`)

- Shows all chemical loads grouped by SDS status (uploaded vs. not yet uploaded).
- Click **View SDS / Safety Data Sheet** to open the PDF in a new tab.
- If you have **admin** role, you can also upload, replace, or delete SDS documents from this page.

---

## HOS Monitoring

**Location:** Dispatch → HOS (`/dispatch/hos`)

- View hours-of-service logs for all drivers.
- Driving hours are recorded automatically when a trip is completed.
- Use this to verify drivers are within legal HOS limits before assigning long trips.

---

## Alerts

**Location:** Dispatch → Alerts (`/dispatch/alerts`)

Alerts are generated automatically for:
- **Late deliveries** — trip is past its scheduled delivery window
- **Offline trucks** — no GPS ping received in >10 minutes
- **Missing inspections** — trip started without a completed pre-trip inspection

---

## Notifications

The bell icon (top navigation bar) shows unread notifications. You receive notifications when:
- A driver updates their trip status
- A new SDS document is uploaded for a load on an active trip

Click a notification to mark it as read. Notifications with a document link open the PDF in a new tab.

---

## Tips

- **Eligible resources filter**: Always select the load first when creating a trip — this ensures the driver and truck dropdowns only show valid options.
- **Draft trips**: Use draft status to plan future trips without assigning drivers yet. Come back and assign resources when schedules are confirmed.
- **Messages vs. phone**: Use in-app messages for routine communication so there is a documented record attached to each trip.
