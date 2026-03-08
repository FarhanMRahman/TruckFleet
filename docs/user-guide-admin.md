# TruckFleet — Admin User Guide

This guide covers every task an admin can perform in TruckFleet.

---

## Signing In

1. Go to the app URL and click **Sign in**.
2. Use your email and password, or click **Sign in with Google**.
3. After signing in you are redirected to `/admin`.

> If you see a different dashboard, your account role may not be set to `admin`. Contact your system administrator or use Drizzle Studio to update the `role` field on your user record.

---

## Managing Trucks

**Location:** Admin → Trucks (`/admin/trucks`)

### Add a Truck
1. Click **Add Truck** (top-right of the page).
2. Fill in:
   - **Name** — e.g. "Tanker One"
   - **License Plate** — must be unique
   - **Vehicle Type** — Tanker, HazMat Truck, Flatbed, or Refrigerated
3. Click **Save**.

The truck will appear in the list with status **Available**.

### Edit a Truck
1. Find the truck in the list.
2. Click the **Edit** (pencil) icon on its row.
3. Update any field and click **Save**.

### Change Truck Status
Truck status is updated automatically when trips are assigned, started, or completed. You can manually change status in the edit modal:
- **Available** — ready for assignment
- **On Trip** — currently assigned to an active trip
- **Maintenance** — out of service for repairs
- **Inactive** — permanently removed from rotation

### Delete a Truck
Click the **Delete** (trash) icon on the truck's row. Trucks linked to active trips cannot be deleted.

---

## Managing Drivers

**Location:** Admin → Drivers (`/admin/drivers`)

### Add a Driver Profile
A driver profile links a user account (which must already exist) to CDL and certification information.

1. Click **Add Driver**.
2. Select the user from the dropdown (only users without a driver profile are listed).
3. Fill in:
   - **License Number** — CDL number
   - **Certifications** — check all that apply: HazMat, TWIC, Tanker, Acid, Compressed Gas, Explosives Precursor
4. Click **Save**.

> Users sign up themselves and default to the Driver role. You create their driver profile here once they're onboarded.

### Edit a Driver
1. Click **Edit** on the driver's row.
2. Update certifications, license number, or status.
3. Click **Save**.

### Driver Statuses
| Status | Meaning |
|---|---|
| Available | Ready to be assigned |
| On Shift | Clocked in but not yet driving |
| Driving | Currently operating a vehicle |
| Delivering | At the delivery point |
| Off Duty | Not available |

### Delete a Driver
Click **Delete** on the driver's row. The linked user account is preserved; only the driver profile is removed.

---

## Managing Chemical Loads

**Location:** Admin → Chemical Loads (`/admin/loads`)

Chemical loads define the types of hazardous materials your fleet carries. Each load acts as a template that is attached to trips.

### Add a Chemical Load
1. Click **Add Load**.
2. Fill in:
   - **Name** — descriptive name, e.g. "Gasoline (Regular)"
   - **Hazard Class** — DOT classification number, e.g. `3`, `8`, `2.3`
   - **UN Number** — international ID, e.g. `UN1203` (optional)
   - **Required Vehicle Type** — the truck type that must be used
   - **Required Certifications** — certifications the driver must hold
   - **Handling Notes** — safety instructions shown to the driver on the trip
3. Click **Save**.

### Upload an SDS Document
Safety Data Sheet (SDS) PDFs can be attached to a chemical load.

1. Open the edit modal for a chemical load (click the **Edit** pencil icon).
2. Scroll to the **SDS Document** section at the bottom of the modal.
3. Click **Upload SDS (PDF)** and select a PDF file (max 10 MB).
4. The upload happens immediately and the modal stays open.
5. A notification is sent to all dispatchers and any driver currently assigned to a trip with this load.

To replace an SDS, upload a new file — the old one is overwritten.

To remove an SDS, click the **trash icon** next to the "View SDS" link.

### Edit / Delete a Load
Use the edit (pencil) and delete (trash) icons in the loads list. Loads attached to active trips cannot be deleted.

---

## Documents Page

**Location:** Dispatch → Documents (`/dispatch/documents`)

As an admin, this page gives you the same upload/delete controls as the admin loads page, but in a read-optimized layout showing all loads grouped by SDS status. You can manage SDS documents from either location.

---

## Viewing Trips (Read Access)

Admins have full read access to the dispatcher interface:
- `/dispatch/trips` — view all trips
- `/dispatch/map` — live fleet map
- `/dispatch/fleet` — availability board

Admins can also create and edit trips from the dispatcher interface.

---

## Notifications

You will receive in-app notifications for:
- Trip status changes (if you created the trip)

The bell icon in the top navigation shows unread notification count. Click a notification to mark it read. Notifications linking to SDS documents open the PDF in a new tab.

---

## Tips

- Use **Drizzle Studio** (`pnpm db:studio`) to directly query the database during development or troubleshooting.
- To bulk-load demo data, run `pnpm db:seed` — this creates 5 demo accounts, 6 trucks, 6 chemical loads, and 5 sample trips.
- All demo accounts use password `Demo1234!`.
