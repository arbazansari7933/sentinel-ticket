# SentinelTicket 

A high-throughput ticket booking REST API that solves the hardest problem in booking systems — preventing seat double-booking when thousands of users attempt to book the same seat at the same millisecond.

Built with a **two-tier distributed locking architecture** combining Redis and PostgreSQL to guarantee both speed and data consistency under concurrent load — inspired by how production systems like BookMyShow and Ticketmaster work at scale.

> Pure backend focus — no frontend UI. All endpoints tested via Postman.

---

## The Problem This Solves

Consider a popular concert where 10,000 users click "Book Seat A1" at the same time:

1. All 10,000 users query the DB → all see seat A1 as `available`
2. All 10,000 proceed to payment
3. All 10,000 write `status = booked` to the DB
4. **Result: 10,000 confirmed bookings for one seat**

This is a **race condition** — and it breaks real booking systems every day. SentinelTicket eliminates it at two independent layers so even if one layer fails, the other catches it.

---

## Two-Tier Locking Architecture

```
Incoming Request
       │
       ▼
┌──────────────────────────────────┐
│      Rate Limiter Middleware     │  Redis sliding window — drops bot
│      (Pre-filter layer)          │  traffic before business logic runs
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│   TIER 1 — Redis Distributed     │  SET NX EX — atomic in-memory lock
│   Lock (Speed Layer)             │  Auto-expires after 10 min if user
│   POST /bookings/hold            │  abandons. Zero disk I/O.
└──────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│   TIER 2 — PostgreSQL Row Lock   │  SELECT FOR UPDATE inside
│   (Safety Layer)                 │  BEGIN / COMMIT / ROLLBACK
│   POST /payment/pay              │  Disk-level guarantee. Even if Redis
│                                  │  fails, no double-booking is possible.
└──────────────────────────────────┘
       │
       ▼
  Booking Confirmed 
```

### Why Two Tiers?

| Layer | Technology | Responsibility |
|---|---|---|
| Tier 1 | Redis `SET NX EX` | Fast in-memory seat hold with auto-TTL release |
| Tier 2 | PostgreSQL `SELECT FOR UPDATE` | Disk-level ACID guarantee during payment |

Redis alone is not enough — it is volatile and could theoretically fail. PostgreSQL row locks alone would be too slow to hold during a 10-minute checkout window. Together they handle both performance and correctness.

---

## Booking Flow (3 Stages)

```
Stage 1 — Hold (POST /bookings/hold)
  → Redis SET NX EX 600 (seat locked for 10 minutes)
  → Postgres: seat status = temporary_locked

Stage 2 — Payment (POST /payment/pay)
  → Verify Redis lock ownership (this user actually holds the lock)
  → BEGIN transaction
  → SELECT * FROM seats FOR UPDATE (row-level lock acquired)
  → Verify seat status = temporary_locked
  → UPDATE seats SET status = booked
  → INSERT INTO bookings + booking_seats
  → COMMIT
  → Release Redis lock

Stage 3 — Failure Cleanup (auto, inside Stage 2)
  → If payment fails: seat status = available
  → Redis lock released
  → User can retry
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js + Express | ES Modules |
| Primary Database | PostgreSQL | 16-alpine |
| Cache / Lock | Redis (ioredis) | 7-alpine |
| Containerization | Docker + Docker Compose | 3.9 |

---

## Project Structure

```
sentinel-ticket/
├── docker-compose.yml
├── Dockerfile
├── package.json
└── src/
    ├── app.js                      # Express app + route registration
    ├── server.js                   # Entry point, DB connection
    ├── config/
    │   ├── db.js                   # PostgreSQL pool (pg)
    │   └── redis.js                # Redis client (ioredis)
    ├── database/
    │   ├── migrate.js              # Custom SQL migration runner
    │   └── migrations/
    │       ├── 001_enable_extensions.sql
    │       ├── 002_create_shows_table.sql
    │       ├── 003_create_seats_table.sql
    │       ├── 004_create_bookings_table.sql
    │       └── 005_create_booking_seats_table.sql
    ├── routes/
    │   ├── admin.routes.js
    │   ├── show.routes.js
    │   ├── booking.routes.js
    │   └── payment.routes.js
    ├── controllers/
    │   ├── admin.controller.js
    │   ├── show.controller.js
    │   ├── booking.controller.js
    │   └── payment.controller.js
    ├── services/
    │   ├── admin.service.js        # Show creation + seat seeding (transaction)
    │   ├── show.service.js         # Browse shows + seats
    │   ├── booking.service.js      # holdSeats + confirmBooking + cleanupFailedPayment
    │   ├── lock.service.js         # acquireLock, releaseLock, verifyLockOwnership
    │   └── payment.service.js      # Payment simulation + orchestration
    ├── repositories/
    │   ├── show.repository.js
    │   └── booking.repository.js   # Seat updates + booking inserts (FOR UPDATE)
    ├── validators/
    │   ├── admin.validator.js
    │   ├── booking.validator.js
    │   └── payment.validator.js
    └── utils/
        └── seatGenerator.js        # Auto-generates seat labels A1, A2 ... H10
```

---

## Database Schema

```sql
shows
├── id              UUID PK (gen_random_uuid)
├── movie_name      VARCHAR NOT NULL
├── hall_name       VARCHAR NOT NULL
├── ticket_price    DECIMAL(10,2) NOT NULL
├── starts_at       TIMESTAMP NOT NULL
└── ends_at         TIMESTAMP NOT NULL

seats
├── id              UUID PK
├── show_id         UUID FK → shows(id)
├── seat_label      VARCHAR NOT NULL        -- "A1", "B12", etc.
└── status          seat_status NOT NULL    -- available | temporary_locked | booked
    └── INDEX: seats(show_id, status)       -- composite index, avoids full table scan

bookings
├── id              UUID PK
├── user_id         UUID NOT NULL
├── show_id         UUID FK → shows(id)
├── payment_status  payment_status          -- pending | completed | failed
├── booking_status  booking_status          -- confirmed | cancelled | expired
├── total_amount    DECIMAL(10,2) NOT NULL
└── created_at      TIMESTAMP DEFAULT NOW()

booking_seats
├── booking_id      UUID FK → bookings(id)
├── seat_id         UUID FK → seats(id)
└── seat_price      DECIMAL(10,2) NOT NULL
```

### Why the composite index on seats(show_id, status)?

Every seat availability query filters by both `show_id` AND `status`. Without this index, every browse request performs a full table scan. At high concurrency with large shows, that is catastrophic. The composite index makes these queries use an index scan instead.

---

## API Reference

### Admin

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/admin/shows` | Create a show and auto-generate all seats |

**Request body:**
```json
{
  "movie_name": "Avengers: Endgame",
  "hall_name": "Hall A",
  "ticket_price": 250,
  "starts_at": "2025-12-25T18:00:00Z",
  "ends_at": "2025-12-25T21:00:00Z",
  "rows": 8,
  "seatsPerRow": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Show created successfully",
  "data": {
    "show": { "id": "uuid", "movie_name": "Avengers: Endgame" },
    "seats": [{ "seat_label": "A1", "status": "available" }]
  }
}
```

---

### Shows (Customer)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/shows` | List all upcoming shows |
| `GET` | `/shows/:show_id` | Get one show by ID |
| `GET` | `/shows/:show_id/seats` | Get all seats with current status |

**GET /shows/:show_id/seats response:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "seat_label": "A1", "status": "available" },
    { "id": "uuid", "seat_label": "A2", "status": "temporary_locked" },
    { "id": "uuid", "seat_label": "A3", "status": "booked" }
  ]
}
```

---

### Bookings

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/bookings/hold` | Hold seats via Redis lock for 10 minutes |

**Request body:**
```json
{
  "userId": "user-uuid",
  "showId": "show-uuid",
  "seatIds": ["seat-uuid-1", "seat-uuid-2"]
}
```

**Success response:**
```json
{
  "success": true,
  "message": "Hold Successfully",
  "data": [{ "seat_label": "A1", "status": "temporary_locked" }]
}
```

**Seat already taken:**
```json
{
  "success": false,
  "message": "Unable to acquire seat lock."
}
```

---

### Payment

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/payment/pay` | Confirm payment with Postgres row-level lock |

**Request body:**
```json
{
  "userId": "user-uuid",
  "showId": "show-uuid",
  "seatIds": ["seat-uuid-1", "seat-uuid-2"]
}
```

**Success response:**
```json
{
  "success": true,
  "message": "Payment successful",
  "data": {
    "booking": {
      "id": "booking-uuid",
      "total_amount": "500.00",
      "payment_status": "completed",
      "booking_status": "confirmed"
    },
    "bookingSeats": [{ "seat_id": "uuid", "seat_price": "250.00" }]
  }
}
```

**Payment failed (seats auto-released):**
```json
{
  "success": false,
  "message": "Payment failed"
}
```

---

## Concurrency Control — Deep Dive

### Tier 1: Redis Distributed Lock

```js
// Atomic — only one user wins when multiple try simultaneously
SET show:<showId>:seat:<seatId>  <userId>  NX  EX  600
//                                          ^        ^
//                              only set if          auto-expires
//                              key does not exist   in 10 minutes
```

Redis processes commands sequentially. If 100 users try to set the same key simultaneously, only one `SET NX` returns `"OK"` — the other 99 return `null` and are rejected instantly, without touching PostgreSQL.

### Tier 2: PostgreSQL Row-Level Lock

```sql
BEGIN;

SELECT * FROM seats
WHERE show_id = $1 AND id = ANY($2)
FOR UPDATE;
-- All other transactions trying to touch these exact rows must WAIT

UPDATE seats SET status = 'booked'
WHERE show_id = $1 AND id = ANY($2)
AND status = 'temporary_locked';

INSERT INTO bookings (...) VALUES (...) RETURNING *;
INSERT INTO booking_seats (...) VALUES (...);

COMMIT;
-- Locks released, Redis lock released
```

Even if Redis fails and multiple users reach this point simultaneously, only one acquires `FOR UPDATE`. The others wait, find the seat already `booked`, and fail gracefully. **Zero double-bookings — guaranteed.**

### Lock Ownership Verification

Before the Postgres transaction, the system verifies the requesting user actually holds the Redis lock:

```js
const lockedUserId = await redis.get(`show:${showId}:seat:${seatId}`);
if (userId !== lockedUserId) throw new Error("Lock not found");
```

This prevents a different user from confirming a booking they never held.

---

## Getting Started

### Prerequisites

- Docker Desktop installed and running
- Git

### Run locally

```bash
# Clone
git clone https://github.com/arbazansari7933/sentinel-ticket.git
cd sentinel-ticket

# Boot all 3 services (Node + PostgreSQL + Redis)
docker-compose up --build
```

### Run migrations

```bash
docker exec -it sentinel-app npm run migrate
```

Expected output:
```
Found 5 migration files
Ran: 001_enable_extensions.sql
Ran: 002_create_shows_table.sql
Ran: 003_create_seats_table.sql
Ran: 004_create_bookings_table.sql
Ran: 005_create_booking_seats_table.sql
All migrations completed successfully
```

### Health check

```
GET http://localhost:3000/health
→ { "status": "OK", "message": "Server is healthy" }
```

---

## Environment Variables

Injected via `docker-compose.yml` — no `.env` file needed for local development.

| Variable | Value | Description |
|---|---|---|
| `PORT` | `3000` | Express server port |
| `DB_HOST` | `postgres` | Docker service name |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_NAME` | `sentinel_ticket` | Database name |
| `REDIS_HOST` | `redis` | Docker service name |
| `REDIS_PORT` | `6379` | Redis port |

---

## Key Engineering Decisions

**Why PostgreSQL instead of MongoDB?**
Row-level locking (`SELECT FOR UPDATE`) is a native PostgreSQL primitive — battle-tested and part of the SQL standard. MongoDB transactions exist but do not provide the same ergonomic row-lock semantics needed for seat-level concurrency control.

**Why Redis for Tier 1 instead of just Postgres locks?**
Holding Postgres row locks for 10 minutes (the checkout window) would block all other transactions touching those rows — catastrophic at scale. Redis holds the seat in memory with a TTL at near-zero cost, no blocking, and auto-releases on timeout with no cleanup job needed.

**Why UUID primary keys?**
UUIDs prevent enumeration attacks — a user cannot guess `/bookings/1`, `/bookings/2` to scrape data. They also support distributed ID generation without a central sequence, relevant for horizontal scaling.

**Why composite index on seats(show_id, status)?**
The most frequent query pattern filters on both columns simultaneously. A single-column index on either alone would still require a secondary filter. The composite index makes the most common seat availability query as fast as possible.

**Why a separate booking_seats junction table?**
Normalized schema enables per-seat pricing (different sections, different prices), individual seat audit trails, and efficient seat-level queries — the correct relational model for a multi-seat booking system.

---

## Author

**Arbaz Ansari**
B.Tech CSE — IES College of Technology, Bhopal
[GitHub](https://github.com/arbazansari7933) · [LinkedIn](https://linkedin.com/in/arbaz-ansari-48b634330) · arbazansari7934@gmail.com
