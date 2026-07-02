# Restaurant Reservation Management System

A full-stack reservation system with customer booking and admin management,
built with **React (Vite)**, **Node.js/Express**, **MongoDB**, and **JWT** auth.

## Project Structure

```
restaurant-reservation-system/
├── backend/     # Express API, MongoDB models, business logic
└── frontend/    # React SPA (Vite)
```

## Setup Instructions

### Backend

```bash
cd backend
cp .env.example .env    # edit MONGO_URI / JWT_SECRET as needed
npm install
npm run seed             # creates an admin user + 6 sample tables
npm run dev               # starts the API on http://localhost:5000
```

Seeded admin login: `admin@restaurant.com` / `admin123` (change immediately in any real deployment).

### Frontend

```bash
cd frontend
cp .env.example .env     # set VITE_API_URL to your backend URL
npm install
npm run dev                # starts the app on http://localhost:5173
```

Customers can self-register from the UI (`/register`); every self-registered
account is a `customer`. The admin account only comes from the seed script,
so the registration endpoint can't be used to mint admin access.

### Deployment

- **Backend**: deploy to Render/Railway. Set `MONGO_URI` (e.g. MongoDB Atlas),
  `JWT_SECRET`, `JWT_EXPIRES_IN`, and `CLIENT_ORIGIN` (your deployed frontend URL) as environment variables.
- **Frontend**: deploy to Vercel/Netlify. Set `VITE_API_URL` to the deployed backend's `/api` URL.

## Assumptions

- Single restaurant, fixed set of tables (seeded programmatically; also manageable by admin at `/admin/tables`).
- Each reservation occupies a **fixed 90-minute slot**. Bookable start times run every 30 minutes
  from 11:00 to 21:30 (so the last seating ends by closing, 23:00). This keeps overlap math well-defined
  without requiring the customer to pick an end time.
- A table can hold exactly one confirmed reservation per overlapping time window — no partial/shared seating.
- Customers do not pick a specific table; the system **auto-assigns the smallest table that fits the party
  size** and has no scheduling conflict (best-fit allocation), so customers only choose date, time, and
  party size. Admins can reassign the table on any reservation via `PUT /api/admin/reservations/:id`.
- Cancelled reservations are kept in the database (status flag) rather than deleted, so history and audit
  trails aren't lost; a cancelled slot immediately frees up the table for new bookings.
- Deactivating a table is a soft delete (`isActive: false`) — it's blocked if the table has upcoming
  confirmed reservations, and historical reservations keep referencing it.
- Registration always creates a `customer`; admin accounts are provisioned out-of-band (seed script / direct
  DB write), not through the public API.

## Reservation & Availability Logic

1. **Time slots** are generated server-side (`utils/validators.js`) as fixed 30-minute increments between
   opening and closing time. The client never invents its own slot values — it fetches valid ones from
   `GET /api/reservations/slots?date=&guests=`, which also tells it which slots currently have room.
2. **Conflict detection** uses standard interval overlap math: two reservations for the *same table* on the
   *same date* conflict if `existing.start < new.end AND new.start < existing.end`. This correctly catches
   partial overlaps, not just exact-slot collisions.
3. **Table assignment**: on creation, if no `tableId` is given, the system searches active tables with
   `capacity >= guests`, sorted smallest-first, and picks the first one with no conflicting reservation.
   If every suitably-sized table is booked, the request fails with `409 Conflict` and a clear message.
4. **Admin edits** re-run the same conflict + capacity checks (excluding the reservation being edited)
   whenever the date, time, guests, or table changes, so an admin can't create a double-booking by editing.
5. Past dates/times are rejected outright.

## Role-Based Access (User vs Admin)

- JWT payload carries `{ id, role }`. `middleware/auth.js` exposes `protect` (verifies the token) and
  `authorize(...roles)` (checks `req.user.role`).
- **Customer** routes (`/api/reservations/*`): create, view own, cancel own. Ownership is enforced in the
  controller (`reservation.user.toString() === req.user._id`), not just at the route level.
- **Admin** routes (`/api/admin/*`) are gated with `authorize('admin')` at the router level, so no admin
  logic is reachable without both a valid token and the admin role.
- The frontend mirrors this with `ProtectedRoute` (redirects unauthenticated users to `/login`, and
  redirects users with the wrong role away from admin-only or customer-only pages) and a role-aware navbar.

## Known Limitations

- Fixed 90-minute reservation duration (not configurable per booking).
- No email/SMS notifications (explicitly out of scope per the assignment).
- No pagination on the admin reservation list — fine at demo scale, would need it for a real restaurant's
  history.
- No refresh-token rotation; JWTs simply expire after `JWT_EXPIRES_IN` and the user must log in again.
- Table management UI only supports create + deactivate (no numeric edit-in-place row), though the backend
  route (`PUT /api/tables/:id`) supports full updates.

## Areas for Improvement (with more time)

- Waitlist support when a requested time is fully booked.
- Optimistic UI concurrency handling for the rare race where two customers grab the same slot within
  milliseconds of each other (currently handled correctly at the DB-query level, but a friendlier
  "someone just took that slot, please pick another" UX would help).
- Automated test suite (Jest/Supertest for the API, React Testing Library for the frontend).
- Admin analytics (occupancy rate, peak hours).
- Configurable restaurant hours and slot duration via an admin-editable settings document instead of
  constants in code.
