# Code Review Findings
**Project:** LogisticsApp
**Reviewed:** 2026-06-14
**Scope:** Entire application — all of `src/` (no git diff; full-source review)
**Effort:** High, recall-biased — multi-angle finders → verify → full list

**Confidence legend:**
- **[Confirmed]** — constructible directly from the code/schema.
- **[Plausible]** — realistic failure on a reachable path, but runtime- or version-dependent.

**Totals:** 28 findings — 2 Critical, 6 High, 16 Medium, 4 Low.

---

## Summary table

| # | Sev | File | Line | Confidence | Issue |
|---|-----|------|------|-----------|-------|
| 1 | 🔴 Critical | `services/auth.service.js` | 94 | Confirmed | Password hash written to audit log on login |
| 2 | 🔴 Critical | `lib/redis.js` | 5 | Confirmed | Redis `{ url }` key ignored → all queues hit localhost |
| 3 | 🔴 High | `services/notification.service.js` | 118 | Confirmed | `logger` used but never imported |
| 4 | 🔴 High | `services/trip.service.js` | 429 | Confirmed | `deleteTrip` catch never re-throws |
| 5 | 🔴 High | `services/order.service.js` | 37 | Confirmed | MongoDB address writes outside Prisma transaction |
| 6 | 🔴 High | `services/trip.service.js` | 14 | Confirmed | TOCTOU race — driver/car double-assignment |
| 7 | 🔴 High | `services/driver.service.js` | 272 | Confirmed | Invalid `TripStatus` value `"InTrip"` |
| 8 | 🔴 High | `controllers/driver.controller.js` | 108 | Confirmed | Calls unimported function → ReferenceError |
| 9 | 🟠 Medium | `utils/jwt.utils.js` | 22 | Confirmed | JWT access token gets refresh-token lifetime in dev |
| 10 | 🟠 Medium | `utils/PrismaFeatures.js` | 29 | Confirmed | Arbitrary Prisma `where` injection from query params |
| 11 | 🟠 Medium | `services/crud.service.js` | 133 | Confirmed | `findById` wraps its own 404 as a 400 |
| 12 | 🟠 Medium | `services/notification.service.js` | 77 | Confirmed | Non-atomic SMS requeue → duplicate sends |
| 13 | 🟠 Medium | `routes/role.route.js` | 39 | Confirmed | `/:id` route shadows `/archived` |
| 14 | 🟠 Medium | `validators/role.validator.js` | 8 | Confirmed | Typo `desdescription` makes description unsettable |
| 15 | 🟠 Medium | `validators/user.validstors.js` | 34 | Confirmed | `name` required on every user update |
| 16 | 🟠 Medium | `validators/trip.validator.js` | 52 | Confirmed | `updateTrip` schema silently drops `startTime` |
| 17 | 🟠 Medium | `services/trip-report.service.js` | 13 | Plausible | `findUnique` with non-unique `isDeleted` filter |
| 18 | 🟠 Medium | `services/client-address.service.js` | 128 | Plausible | Null deref in catch masks the 404 |
| 19 | 🟠 Medium | `services/car-maintenance.service.js` | 164 | Plausible | `deleteMaintenance` forces car to `Active` |
| 20 | 🟠 Medium | `controllers/car-maintenance.controller.js` | 28 | Plausible | Nested maintenance routes ignore `:carId` |
| 21 | 🟠 Medium | `utils/generate-Unique-String.js` | 5 | Confirmed | Weak alphabet (duplicate chars, low entropy) |
| 22 | 🟠 Medium | `utils/getFileUrl.js` | 11 | Plausible | File URL built from attacker-controlled Host header |
| 23 | 🟠 Medium | `utils/date.utils.js` | 6 | Plausible | `getSaudiTime` double-applies timezone offset |
| 24 | 🟠 Medium | `utils/PrismaFeatures.js` | 53 | Confirmed | Unsanitized sort field → unhandled 500 |
| 25 | 🟡 Low | `services/role.service.js` | 125 | Confirmed | `softDeleteRole` returns `undefined` on success |
| 26 | 🟡 Low | `services/car-maintenance.service.js` | 12 | Plausible | Car read with global client before transaction |
| 27 | 🟡 Low | `server.js` | 19 | Plausible | No HTTP server drain on shutdown |
| 28 | 🟡 Low | `utils/readExcel.js` | 4 | Plausible | Workbook loaded fully into memory (OOM risk) |

---

## 🔴 Critical

### 1. Password hash written to audit log on login — `services/auth.service.js:94` [Confirmed]

`recordActivity` is called with `newData: user` (the full DB object including the bcrypt hash) before the password is stripped on line 100.

**Failure scenario:** Every successful login permanently stores the bcrypt password hash in the audit collection. Anyone with read access to audit records can harvest all password hashes for offline cracking.

**Fix:** Strip the password before the `recordActivity` call, or pass `userWithoutPassword` as `newData`.

---

### 2. Redis connection uses unsupported `{ url }` key → all queues hit localhost — `lib/redis.js:5` [Confirmed]

```js
export const redisConnectionConfig = { url: process.env.REDIS_URL || "redis://redis:6379" };
```

ioredis `RedisOptions` has no `url` property; BullMQ passes this object straight to ioredis, which ignores the unknown key and defaults to `127.0.0.1:6379`. There is also no `.on('error')` handler anywhere.

**Failure scenario:** In Docker (`REDIS_URL=redis://redis:6379`, host `redis`), the configured host is never contacted. Every `smsQueue`/`dispatchQueue` operation and both workers fail with `ECONNREFUSED`, surfacing only as silent BullMQ retries. The entire SMS/notification subsystem is non-functional.

**Fix:** Pass the URL as the ioredis constructor string (`connection: process.env.REDIS_URL`) or use `{ host, port }`. Add a connection `error` listener.

---

## 🔴 High

### 3. `logger` used but never imported — `services/notification.service.js:118` [Confirmed]

`updateNotificationStatus` calls `logger.error(...)` in its catch block, but `logger` is never imported.

**Failure scenario:** When `prisma.notification.update` fails, the catch throws `ReferenceError: logger is not defined`, crashing the BullMQ worker job and losing the original error. `smsJobId` is never written back.

**Fix:** `import { logger } from '../utils/winston.js';`

---

### 4. `deleteTrip` catch never re-throws — `services/trip.service.js:429` [Confirmed]

The catch records a FAILED audit entry but omits `throw error`.

**Failure scenario:** If `prisma.trip.update` fails (already deleted, DB timeout), the function returns `undefined`, the controller treats it as success and returns a 2xx. The trip appears deleted but is unchanged. (`newTrip` and `updateTrip` both correctly re-throw.)

**Fix:** Add `throw error;` as the last line of the catch.

---

### 5. MongoDB address writes outside the Prisma transaction — `services/order.service.js:37` [Confirmed]

`ClientAddress.create()` (MongoDB) runs inside the `prisma.$transaction` callback but cannot participate in a Prisma rollback.

**Failure scenario:** If `tx.order.create` or `tx.orderStatusHistory.create` throws, Prisma rolls back the PG writes but the MongoDB address documents are already committed — permanent orphans with no cleanup path.

**Fix:** Write MongoDB documents only after the Prisma transaction commits, or add a compensating delete on failure.

---

### 6. TOCTOU race — driver/car double-assignment — `services/trip.service.js:14` (also `:33`, `:197`, `:247`) [Confirmed]

Availability checks use the global `prisma` client (`crud.findOne`), not the transaction `tx`. The check and the status update are not atomic.

**Failure scenario:** Two concurrent `POST /trips` for the same driver both read `status: "Active"`, both pass the guard, both `tx.driver.update({ status: "InTrip" })`, both commit. The driver is assigned to two active trips. Same for the car check and for `updateTrip` substitutions.

**Fix:** Perform availability checks inside the transaction with `tx`, and add a DB-level partial unique index enforcing one active trip per driver/car.

---

### 7. Invalid `TripStatus` value `"InTrip"` — `services/driver.service.js:272` [Confirmed]

```js
await tx.trip.updateMany({ where: { driverId, status: { not: "InTrip" } }, data: { status: "InTrip" } });
```

The `TripStatus` enum is `Scheduled | InProgress | Completed | Cancelled` — there is no `InTrip` (that value belongs to `DriverStatus`/`CarStatus`).

**Failure scenario:** Setting any driver to `InTrip` runs this `updateMany` with an invalid enum value → `PrismaClientValidationError` aborts the transaction. A driver can never be moved to `InTrip`; the update always 500s.

**Fix:** Use a valid `TripStatus` value (e.g. `InProgress`) for the trip update.

---

### 8. Controller calls an unimported function — `controllers/driver.controller.js:108` [Confirmed]

`fetchArchivedDriverStatusHistory` calls `getArchivedCarStatusHistory(driverId, query)`, which is exported from `driver.service.js` but never imported into the controller.

**Failure scenario:** `GET /driver/archived/driverStatus/:id` throws `ReferenceError: getArchivedCarStatusHistory is not defined` → 500 on every call. The endpoint can never succeed.

**Fix:** Add the import (and rename — it operates on drivers, not cars).

---

## 🟠 Medium

### 9. JWT access token gets refresh-token lifetime in dev — `utils/jwt.utils.js:22` [Confirmed]

The inner ternary is inverted: in `NODE_ENV === 'dev'`, access tokens receive `REFRESH_TOKEN_EXPIRE_IN` instead of `ACCESS_TOKEN_EXPIRE_IN`.

**Failure scenario:** Any dev/staging/CI environment issues long-lived access tokens, widening the stolen-token and `passwordChangedAt` revocation window to the refresh-token lifetime.

**Fix:** Swap the branches, or always use `ACCESS_TOKEN_EXPIRE_IN` for access tokens.

---

### 10. Arbitrary Prisma `where` injection from query params — `utils/PrismaFeatures.js:29` [Confirmed]

`filter()` removes only `page/limit/sort/search` and spreads everything else into the Prisma `where`.

**Failure scenario:** `GET /users?roleId=<admin-uuid>` enumerates admins; `?isActive=false` lists deactivated users; `?driverId=<id>` enumerates a driver's trips. Any model field becomes a free, unauthorized filter.

**Fix:** Replace the open spread with a per-endpoint allowlist of permitted filter fields.

---

### 11. `findById` wraps its own 404 as a 400 — `services/crud.service.js:133` [Confirmed]

The 404 thrown on line 128 is caught and re-emitted as `createAppError(400, 'Error finding ...')`.

**Failure scenario:** Every caller relying on `findById` for not-found (`newTrip`, `updateUserService`, `createNewUser`, …) gets a 400 with a garbled message instead of a 404. Downstream `if (!found) throw 404` guards are dead code.

**Fix:** Re-throw app errors unchanged: `if (error.status) throw error;` before wrapping; use 500 for genuine errors.

---

### 12. Non-atomic SMS requeue → duplicate sends — `services/notification.service.js:77` [Confirmed]

`queueSmsBulk` and the two `updateMany` calls are not transactional.

**Failure scenario:** If the `requeueCount` increment fails after `queueSmsBulk` enqueues, the rows stay `queued` and are re-queued (and re-sent) on every subsequent cron cycle.

**Fix:** Wrap the updates in a Prisma transaction, or reconcile post-enqueue failures.

---

### 13. `/:id` route shadows `/archived` — `routes/role.route.js:39` vs `:48` [Confirmed]

`GET /:id` is registered before `GET /archived`; Express matches in order.

**Failure scenario:** `GET /role/archived` is routed into `findRoleById` with `id="archived"` → 404/Prisma error. The archived-roles listing is unreachable. (Other resources order `/archived` first.)

**Fix:** Register `/archived` before `/:id`.

---

### 14. Typo `desdescription` makes role description unsettable — `validators/role.validator.js:8,15` [Confirmed]

Schema field is `desdescription`, but the model/search field is `description`.

**Failure scenario:** A client sending `description` has it stripped by Zod (never persisted). A client sending `desdescription` has it spread into `prisma.role.create`, which rejects the unknown argument → 500. Role description can never be set.

**Fix:** Rename the schema key to `description`.

---

### 15. `name` required on every user update — `validators/user.validstors.js:34` [Confirmed]

In `updateUserSchema`, `name` lacks `.optional()` (unlike all other fields). `updateRoleSchema` has the same problem.

**Failure scenario:** `PUT /users/:id` changing only `isActive`/`roleId`/`phone` fails with "Name is required" (400) for a legitimate partial update.

**Fix:** Make `name` optional in update schemas.

---

### 16. `updateTrip` schema silently drops `startTime` — `validators/trip.validator.js:52` [Confirmed]

`updateTrip` defines `endTime` but not `startTime`; `validate` replaces `req.body` with the parsed object, stripping unknown keys.

**Failure scenario:** `PATCH /trip/:id` with a new `startTime` returns 200 but the field is stripped before the service — a silent no-op.

**Fix:** Add `startTime` (optional) to the `updateTrip` schema.

---

### 17. `findUnique` with non-unique `isDeleted` filter — `services/trip-report.service.js:13` & `services/order.service.js:254` [Plausible]

```js
prisma.trip.findUnique({ where: { id: tripId, isDeleted: false }, ... })
```

Prisma `findUnique` `where` is restricted to unique fields; a non-unique `isDeleted` can throw `PrismaClientValidationError`.

**Failure scenario:** Trip-manifest generation (and `getOrderById`, which uses the same pattern) fails before producing a result. Verify against the project's Prisma 7 runtime — it is a latent failure in both locations.

**Fix:** Use `findFirst` for queries that combine a unique id with a non-unique filter.

---

### 18. Null deref in catch masks the 404 — `services/client-address.service.js:128` [Plausible]

When the address isn't found, `address` is `null`, but the catch builds a description from `address.city`.

**Failure scenario:** `softDeleteAddress(req, badId)` → 404 thrown → catch dereferences `null.city` → `TypeError` replaces the clean 404 with an opaque 500.

**Fix:** Guard the description (`address?.city`) or build it before the not-found throw.

---

### 19. `deleteMaintenance` forces car to `Active` — `services/car-maintenance.service.js:164` [Plausible]

Deleting any maintenance record sets the car's `currentStatus` to `Active` unconditionally.

**Failure scenario:** A car that is `InTrip`/`Inactive`, or whose deleted maintenance never set it `InMaintenance` (future-dated), is wrongly flipped to `Active` with a misleading status-history entry.

**Fix:** Only reset to `Active` when the car is actually `InMaintenance` due to the record being deleted.

---

### 20. Nested maintenance routes ignore `:carId` — `controllers/car-maintenance.controller.js:28,34` [Plausible]

Update/delete pass only `maintenanceId` to the service, which looks it up without validating it belongs to `carId`.

**Failure scenario:** `PATCH/DELETE /cars/:carId/maintenance/:maintenanceId` with a mismatched `carId` still edits/deletes another car's maintenance record. Path scoping is meaningless; no 404 for the mismatch.

**Fix:** Scope the lookup by both `carId` and `maintenanceId`.

---

### 21. Weak unique-string alphabet — `utils/generate-Unique-String.js:5` [Confirmed]

`customAlphabet('12345slah.sa', …)` has duplicate characters (`s`, `a`) and only ~10 distinct symbols.

**Failure scenario:** Generated **passwords** (8 chars) and usernames have far lower entropy than nominal and skewed distribution, raising guess/collision probability — a unique-constraint insert failure or a weak temporary credential sent over SMS.

**Fix:** Use a full, de-duplicated alphabet (e.g. nanoid's default or `A–Za–z0–9`).

---

### 22. File URL built from attacker-controlled Host header — `utils/getFileUrl.js:11` (also `services/driver.service.js:18`) [Plausible]

URLs are built from `req.get("host")` + `req.protocol`.

**Failure scenario:** A forged `Host: evil.com` yields `https://evil.com/public/uploads/...`. If persisted on a photo record or returned to other users, it becomes a host-header-poisoning / asset-redirection vector.

**Fix:** Build URLs from a trusted configured base (e.g. `APP_BASE_URL`).

---

### 23. `getSaudiTime` double-applies the timezone offset — `utils/date.utils.js:6` [Plausible]

Returns `new Date(utcMillis + 3h)` — a Date whose UTC instant is shifted, not a correctly-zoned time.

**Failure scenario:** Any tz-aware formatter or `.toISOString()` consumer adds the offset again (≈ +3h too far), pushing day-boundary/expiry comparisons across midnight → off-by-one-day errors. (The luxon-based `clock.js`/`notifaction-windows.js` are correct; this parallel util is the trap.)

**Fix:** Format with a timezone via Intl/luxon instead of manually shifting the instant.

---

### 24. Unsanitized sort field → unhandled 500 — `utils/PrismaFeatures.js:53` [Confirmed]

User-supplied sort field names go straight to Prisma `orderBy`.

**Failure scenario:** `?sort=unknownField` triggers a Prisma runtime error that escapes as a 500 instead of a clean 400. Any typo or probe errors the server.

**Fix:** Validate sort fields against a per-model allowlist.

---

## 🟡 Low

### 25. `softDeleteRole` returns `undefined` on success — `services/role.service.js:125` [Confirmed]

`if (isDeletedRole.isDeleted == false) return isDeletedRole;` — after a soft delete, `isDeleted` is `true`, so the function returns nothing.

**Failure scenario:** A successful delete logs SUCCESS but returns `undefined`; any controller expecting the deleted record back gets an empty body.

**Fix:** Return `isDeletedRole` unconditionally (or invert the guard).

---

### 26. Car read with global client before the transaction — `services/car-maintenance.service.js:12` [Plausible]

The car fetch and `shouldUpdateStatus` decision happen with the global `prisma` client before the `$transaction`.

**Failure scenario:** A concurrent soft-delete/status change between the read and the transaction makes the in-transaction writes (maintenance record, `InMaintenance` history) act on stale data — same class as the trip TOCTOU.

**Fix:** Read and decide inside the transaction with `tx`.

---

### 27. No HTTP server drain on shutdown — `server.js:19` + `lib/lifecycle.js` [Plausible]

The `app.listen()` server handle is discarded; `server.close()` is never called.

**Failure scenario:** On SIGTERM, `shutdown()` tears down Prisma/Mongo/queues then `process.exit(0)` while the listener still accepts connections — in-flight requests abort and new ones during the drain window hit closed DB/queue connections → 500s.

**Fix:** Capture the server from `app.listen()` and `await server.close()` first in the shutdown sequence.

---

### 28. Workbook loaded fully into memory — `utils/readExcel.js:4` [Plausible]

`xlsx.readFile` + `sheet_to_json` materialize the whole file and all rows synchronously.

**Failure scenario:** A large or crafted `.xlsx` spikes RSS and blocks the event loop; a big enough file OOM-kills the process. No size or row cap.

**Fix:** Enforce an upload size/row limit and/or stream-parse.

---

## Suggested fix order

1. **Ship-blockers (1 line each):** #1 (password in audit), #3 (logger import), #4 (deleteTrip throw), #7 (`InTrip` enum), #8 (missing import).
2. **Infra:** #2 (Redis connection) — without this the whole queue/notification system is down.
3. **Data integrity:** #5 (Mongo/PG split), #6 & #26 (TOCTOU races), #12 (duplicate SMS).
4. **Security:** #9 (JWT expiry), #10 (filter injection), #21 (weak credentials), #22 (host header).
5. **Routing/validation correctness:** #11, #13, #14, #15, #16, #17, #18, #19, #20, #24.
6. **Hardening:** #23, #25, #27, #28.
