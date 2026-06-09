# Testing Guide — Logistic Notification System

## Prerequisites

Infrastructure must be running before any test:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis mongo pgweb
```

Wait for postgres to be ready:
```bash
until docker exec logistics-db pg_isready -U logistic_app -d logistic_app 2>&1 | grep -q "accepting"; do sleep 2; done && echo "Ready"
```

---

## 1. Apply Migrations (first time only)

```bash
DATABASE_URL="postgresql://logistic_app:88C6wUHSpl7f8ncnL3@localhost:5432/logistic_app" \
  npx prisma migrate deploy
```

---

## 2. Trigger full cron pipeline (one command, real SMS)

Runs the same path as production cron: advisory lock → `dispatch-queue` → `dispatchAllReminders` → `sms-queue` → Jawaly.  
Ephemeral workers run inside the script so you do not need `logistic-worker` running (stop it first to avoid duplicate dispatch).

**From project root (PowerShell).** If running on the host (not inside Docker), point `.env` at localhost:

```env
DATABASE_URL=postgresql://logistic_app:YOUR_PASSWORD@localhost:5432/logistic_app
REDIS_URL=redis://localhost:6379
SMS_NOTIFICATIONS_ENABLED=true
```

```powershell
cd e:\slash\LogisticsApp
# scripts/trigger-cron.js is gitignored — copy from a teammate or keep your local copy
node --env-file=.env scripts/trigger-cron.js
# or: npm run cron:trigger
```

| Flag | Effect |
|------|--------|
| `--inline` | Skip `dispatch-queue`; run `dispatchAllReminders` directly, then drain SMS |
| `--dry-run` | DB pipeline only; no real SMS |
| `--no-lock` | Skip Postgres advisory lock |

Ensure at least one driver has `license_expiry` / `national_id_expiry` inside a cron window and a valid `phone` (see §8).

---

## 3. Full Production Test (seed + cron + real SMS)

Runs every reminder kind end-to-end. Seeds a driver, car, and maintenance records with
dates tuned to fall inside every cron window, fires the real `dispatchAllReminders()` logic,
verifies all 7 Notification rows were created, and sends 2 real SMS to the driver's phone.

```bash
cd /home/administrator/Documents/Logistic/logistic

DATABASE_URL="postgresql://logistic_app:88C6wUHSpl7f8ncnL3@localhost:5432/logistic_app" \
REDIS_URL="redis://localhost:6379" \
SMS_NOTIFICATIONS_ENABLED="true" \
  node prisma/seed.js
```

### What it creates

| # | Entity | Document | Kind | Window | SMS |
|---|--------|----------|------|--------|-----|
| 1 | Driver أحمد محمد | license | PRE_EXPIRY | today+3mo+2d | ✅ Real SMS |
| 2 | Driver أحمد محمد | nationalId | POST_EXPIRY | today-43d | ✅ Real SMS |
| 3 | Car PROD01 | insurance | PRE_EXPIRY | today+3mo+2d | DB only |
| 4 | Car PROD01 | registration | POST_EXPIRY | today-43d | DB only |
| 5 | Maintenance A | maintStart | MAINT_PRE | today+9d | DB only |
| 6 | Maintenance A | maintEnd | MAINT_PRE | today+11d | DB only |
| 7 | Maintenance B | maintDue | MAINT_DUE | today | DB only |

Expected output ends with:
```
🎉 ALL 7/7 CHECKS PASSED — Full production pipeline is working correctly.
```

### To run with SMS disabled (no real SMS, just verify DB rows)

```bash
DATABASE_URL="postgresql://logistic_app:88C6wUHSpl7f8ncnL3@localhost:5432/logistic_app" \
REDIS_URL="redis://localhost:6379" \
SMS_NOTIFICATIONS_ENABLED="false" \
  node prisma/seed.js
```

---

## 4. Process Queued Jobs (SMS Worker)

The seed leaves `driver` rows with `status=queued`. Start the worker to flip them to `sent`:

```bash
cd /home/administrator/Documents/Logistic/logistic

DATABASE_URL="postgresql://logistic_app:88C6wUHSpl7f8ncnL3@localhost:5432/logistic_app" \
REDIS_URL="redis://localhost:6379" \
SMS_NOTIFICATIONS_ENABLED="true" \
  node src/worker.js
```

Watch for:
```
info: Successfully sent SMS job X
info: SMS Job X has completed!
```

---

## 5. Verify Notification Table

```bash
docker exec logistics-db psql -U logistic_app -d logistic_app -c "
SELECT entity_type, doc_type, kind, status, sms_job_id, target_date
FROM notifications ORDER BY sent_at;"
```

Expected final state:

| entity_type | doc_type | kind | status | sms_job_id |
|---|---|---|---|---|
| driver | license | PRE_EXPIRY | **sent** | `3` (or any job id) |
| driver | nationalId | POST_EXPIRY | **sent** | `4` |
| car | insurance | PRE_EXPIRY | queued | *(no phone — expected)* |
| car | registration | POST_EXPIRY | queued | *(no phone — expected)* |
| maintenance | maintStart | MAINT_PRE | queued | *(no phone — expected)* |
| maintenance | maintEnd | MAINT_PRE | queued | *(no phone — expected)* |
| maintenance | maintDue | MAINT_DUE | queued | *(no phone — expected)* |

### Check for duplicates (must return 0 rows)

```bash
docker exec logistics-db psql -U logistic_app -d logistic_app -c "
SELECT entity_type, entity_id, doc_type, kind, target_date, COUNT(*) AS cnt
FROM notifications
GROUP BY entity_type, entity_id, doc_type, kind, target_date
HAVING COUNT(*) > 1;"
```

---

## 6. Test Raw SMS Gateway (Jawaly)

Sends a real SMS directly to Jawaly — bypasses DB and BullMQ entirely.

```bash
cd /home/administrator/Documents/Logistic/logistic
node --env-file=.env scripts/test-sms.js 966XXXXXXXXX
```

- Phone must be a **Saudi number** (966 prefix). Jawaly does not support international numbers.
- Registered senders: `SLASHco`, `SLASHco-AD`
- Account balance is shown before sending.

Example successful response:
```json
{
  "code": 200,
  "message": "تم حفظ الرسائل بنجاح",
  "messages": [{ "success_count": 1, "error_count": 0, "total_cost": 2 }]
}
```

---

## 7. Reset Test Data

Run before each fresh test to clear all test entities:

```bash
docker exec logistics-db psql -U logistic_app -d logistic_app -c "
DELETE FROM notifications;
DELETE FROM car_maintenance_history;
DELETE FROM car_status_history;
DELETE FROM cars;
DELETE FROM driver_status_history;
DELETE FROM drivers;"
```

---

## 8. Browse DB in Browser

pgweb is included in the stack:

- URL: **http://localhost:5051**
- Username: `admin`
- Password: `admin123`

---

## 9. Cron Window Reference

The cron runs daily at **06:00 Asia/Riyadh**. To trigger a reminder, the document's
date must fall inside the corresponding window at the time the cron runs:

| Kind | Trigger condition | Window | Buffer |
|------|-------------------|--------|--------|
| PRE_EXPIRY | expiry in ~3 months | `[today+3mo, today+3mo+6d]` | 7 days |
| POST_EXPIRY | expired ~45 days ago | `[today-45d, today-45d+6d]` | 7 days |
| MAINT_PRE | maintenance start/end in ~7 days | `[today+7d, today+13d]` | 7 days |
| MAINT_DUE | maintenance ending today | `[today, today+6d]` | 7 days |

The 7-day buffer means a missed cron run (e.g. server restart) will catch up on the next run without sending duplicates — the `@@unique` dedup key blocks re-insertion for the same `targetDate`.

---

## 10. Dedup Key Explained

A Notification row is only ever created **once** per:

```
(entityType, entityId, docType, kind, targetDate)
```

If the cron runs again on the same day, `prisma.notification.create()` throws `P2002`
(unique constraint violation) → silently skipped → **no duplicate SMS**.

When a document is **renewed** (expiry date changes), the next cron computes a new
`targetDate` → new unique key → new reminder cycle. No manual cleanup needed.

---

## 11. Environment Variables Cheat Sheet

| Variable | Purpose | Required for SMS |
|---|---|---|
| `DATABASE_URL` | Postgres connection | ✅ |
| `REDIS_URL` | BullMQ / Redis connection | ✅ |
| `SMS_NOTIFICATIONS_ENABLED` | `"true"` to send real SMS | ✅ |
| `SMS_SENDER` | Must be `SLASHco` or `SLASHco-AD` | ✅ |
| `JAWALY_API_KEY` | Jawaly API key | ✅ |
| `JAWALY_API_SECRET` | Jawaly API secret | ✅ |
| `JAWALY_BASE_URL` | `https://api-sms.4jawaly.com/api/v1` | ✅ |
| `PG_POOL_MAX` | Postgres pool size per process (worker: 8, API: 10) | ✅ |
| `DB_CONCURRENCY` | Max concurrent notification INSERTs (default 5) | worker |
| `CRON_STARTUP_DELAY_MS` | Delay before startup catch-up (default 45000) | worker |
| `CRON_RUN_ON_STARTUP` | Set `false` to skip startup catch-up | worker |
| `SMS_WORKER_CONCURRENCY` | Parallel SMS sends (default 3) | worker |
