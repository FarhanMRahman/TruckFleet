# TruckFleet — Driver User Guide

This guide covers everything a driver needs to use TruckFleet on their phone or desktop.

---

## Getting Started

### Installing as a PWA (Recommended for Mobile)
TruckFleet is a Progressive Web App — you can install it to your home screen without going through an app store.

**iPhone / iPad (Safari):**
1. Open the app URL in Safari.
2. Tap the **Share** button (box with arrow).
3. Tap **Add to Home Screen**.

**Android (Chrome):**
1. Open the app URL in Chrome.
2. Tap the three-dot menu → **Add to Home Screen** (or an install banner may appear automatically).

### Signing In
1. Open TruckFleet (from browser or home screen icon).
2. Enter your email and password, or tap **Sign in with Google**.
3. You will land on your driver home screen.

> If you see a different screen after signing in, your account hasn't been set up with the Driver role yet. Contact your dispatcher.

---

## Home Screen

**Location:** `/driver`

The home screen shows:
- **Today's trip card** — your current or next scheduled trip with origin, destination, and load name
- **Your current status** — with buttons to update it (see Status Updates below)
- **Quick actions** — tap the trip card to open the full detail view

---

## Updating Your Status

Use the status buttons on the home screen or trip detail page to keep dispatch informed:

| Status | When to use it |
|---|---|
| Available | You're ready to be assigned |
| On Shift | You've started your shift but haven't departed yet |
| Driving | You've left the pickup location and are en route |
| Delivering | You've arrived at the destination and are unloading |

Your dispatcher can see your status in real time.

---

## My Trips

**Location:** Driver → Trips (`/driver/trips`)

Lists all your trips — active, upcoming, and historical.

Tap any trip to open its detail view.

---

## Trip Detail

**Location:** `/driver/trips/[id]`

### Load Information
- Chemical name, hazard class (e.g. Class 3 — Flammable Liquids), UN number
- Handling notes (read these carefully — they contain safety instructions specific to this chemical)
- Link to the SDS (Safety Data Sheet) PDF if one has been uploaded

### Navigation
Tap the **Navigate** button to open your destination directly in:
- Google Maps (Android)
- Apple Maps (iPhone)

### Starting a Trip

Before you can start a trip you must complete the **Pre-Trip Inspection**:

1. On the trip detail page, tap **Pre-Trip Inspection**.
2. Check each item on the list:
   - Brakes operational
   - Lights and signals
   - HazMat placards visible and correct
   - Load secured properly
   - PPE kit present
   - Fire extinguisher present
   - Emergency contact list present
3. Tap **Submit Inspection**.

Once the inspection is complete, the **Start Trip** button unlocks.

4. Tap **Start Trip** → trip status moves to **In Progress**.
5. Your status automatically updates to **Driving**.

### Delivering a Trip

1. When you arrive, update your status to **Delivering**.
2. Complete the **Post-Trip Inspection** (same checklist as pre-trip).
3. Capture a **Proof of Delivery** signature:
   - Sign in the signature box using your finger
   - Add optional notes (e.g. "Left with dock supervisor John")
   - Tap **Submit**
4. Tap **Mark Delivered** — the trip is complete.

---

## Messages

**Location:** Driver → Messages (`/driver/messages`) or within any trip detail

- Your message thread with dispatch for each trip.
- Tap a conversation to open it and send or read messages.
- You'll see new messages in real time when the app is open.

### Sending a Message
1. Open the trip (from Messages or Trips list).
2. Scroll to the **Messages** section.
3. Type your message and tap **Send** or press Enter.

---

## Documents (SDS / Safety Data Sheets)

**Location:** Driver → Documents (`/driver/documents`)

- Lists all your trips with their associated chemical loads.
- If an SDS PDF is available, tap **View SDS / Safety Data Sheet** to open it.
- If no SDS has been uploaded yet, the card shows "SDS not yet uploaded — contact admin".

You'll receive a notification when a new SDS is uploaded for a load on your trip. Tap the notification to open the PDF directly.

---

## Hours of Service

**Location:** Driver → HOS (`/driver/hos`)

- Shows your current shift start time and accumulated driving hours.
- Driving time is logged automatically when trips are completed.
- Review this to ensure you're within legal driving hour limits.

---

## Notifications

The bell icon (top-right on desktop, accessible via menu on mobile) shows your notifications.

You'll be notified when:
- A trip is assigned to you
- A trip is cancelled
- A new SDS document is uploaded for your trip's chemical load

Tap a notification to mark it as read. Notifications with a document open the PDF in a new tab.

---

## Tips

- **Always complete the pre-trip inspection** before departure — the Start Trip button is locked until it's done.
- **Keep your status updated** — dispatchers use your status to coordinate pickups and monitor the fleet.
- **Read handling notes carefully** — they contain chemical-specific safety procedures required for your load.
- **Use in-app messages** for trip-related communication so there is a record attached to the trip.
- **If you have no internet**: the app will show your last-loaded data. GPS location updates require connectivity.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "Start Trip" button is greyed out | Complete the pre-trip inspection first |
| Can't see my trip | Ask your dispatcher — you may not be assigned yet |
| SDS document won't open | Try opening it in a different browser tab manually |
| GPS not updating | Check that the browser has location permission enabled for this site |
| Notifications not appearing | Check that browser notifications are allowed, or look in the bell menu |
