/**
 * Backfill: migrate legacy *ReminderSentAt flag columns into Notification rows.
 *
 * Run order (one-time, before migration B drops legacy columns):
 *   1. npx prisma migrate deploy
 *   2. node scripts/backfill-notifications.js
 *   3. npx prisma migrate deploy   (migration that drops legacy flag columns)
 *
 * Safe to re-run: createMany with skipDuplicates.
 * Legacy second-reminder flags are not backfilled (no POST_EXPIRY equivalent).
 *
 * If legacy columns are already dropped, the script exits successfully with a message.
 */

import "dotenv/config";
import { randomUUID } from "crypto";
import {
  NotificationEntityType,
  NotificationDocType,
  NotificationKind,
} from "@prisma/client";
import { prisma, disconnectPrisma } from "../src/lib/prisma.js";

const LEGACY_DRIVER_FLAG = "identityReminderSentAt";

/** Returns true when pre-migration reminder flag columns still exist. */
const legacyColumnsExist = async () => {
  const rows = await prisma.$queryRaw`
    SELECT 1 AS ok
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'drivers'
      AND column_name = ${LEGACY_DRIVER_FLAG}
    LIMIT 1
  `;
  return Array.isArray(rows) && rows.length > 0;
};

/**
 * Builds a Notification row for createMany (current schema: FK columns only, no entity_id).
 */
const buildRow = ({
  entityType,
  docType,
  kind,
  targetDate,
  sentAt,
  driverId = null,
  carId = null,
  maintenanceId = null,
}) => ({
  id: randomUUID(),
  entityType,
  docType,
  kind,
  targetDate: targetDate ? new Date(targetDate) : new Date(sentAt),
  sentAt: new Date(sentAt),
  status: "sent",
  driverId,
  carId,
  maintenanceId,
});

const run = async () => {
  console.log("[backfill] Starting notification backfill...");

  if (!(await legacyColumnsExist())) {
    console.log(
      "[backfill] Legacy reminder columns not found — backfill already applied or migration B ran.",
    );
    return;
  }

  let total = 0;

  // ─── Drivers ──────────────────────────────────────────────────────────────

  const drivers = await prisma.$queryRaw`
    SELECT
      id,
      national_id_expiry AS "nationalIdExpiry",
      license_expiry AS "licenseExpiry",
      identity_reminder_sent_at AS "identityReminderSentAt",
      license_reminder_sent_at AS "licenseReminderSentAt"
    FROM drivers
    WHERE identity_reminder_sent_at IS NOT NULL
       OR license_reminder_sent_at IS NOT NULL
  `;

  const driverRows = [];
  for (const d of drivers) {
    if (d.identityReminderSentAt) {
      driverRows.push(
        buildRow({
          entityType: NotificationEntityType.DRIVER,
          docType: NotificationDocType.NATIONAL_ID,
          kind: NotificationKind.PRE_EXPIRY,
          targetDate: d.nationalIdExpiry,
          sentAt: d.identityReminderSentAt,
          driverId: d.id,
        }),
      );
    }
    if (d.licenseReminderSentAt) {
      driverRows.push(
        buildRow({
          entityType: NotificationEntityType.DRIVER,
          docType: NotificationDocType.LICENSE,
          kind: NotificationKind.PRE_EXPIRY,
          targetDate: d.licenseExpiry,
          sentAt: d.licenseReminderSentAt,
          driverId: d.id,
        }),
      );
    }
  }

  if (driverRows.length > 0) {
    const result = await prisma.notification.createMany({
      data: driverRows,
      skipDuplicates: true,
    });
    console.log(`[backfill] Driver notifications inserted: ${result.count}`);
    total += result.count;
  }

  // ─── Cars ─────────────────────────────────────────────────────────────────

  const cars = await prisma.$queryRaw`
    SELECT
      id,
      insurance_expiry_date AS "insuranceExpiryDate",
      registration_expiry_date AS "registrationExpiryDate",
      insurance_reminder_sent_at AS "insuranceReminderSentAt",
      license_reminder_sent_at AS "licenseReminderSentAt"
    FROM cars
    WHERE insurance_reminder_sent_at IS NOT NULL
       OR license_reminder_sent_at IS NOT NULL
  `;

  const carRows = [];
  for (const c of cars) {
    if (c.insuranceReminderSentAt) {
      carRows.push(
        buildRow({
          entityType: NotificationEntityType.CAR,
          docType: NotificationDocType.INSURANCE,
          kind: NotificationKind.PRE_EXPIRY,
          targetDate: c.insuranceExpiryDate,
          sentAt: c.insuranceReminderSentAt,
          carId: c.id,
        }),
      );
    }
    if (c.licenseReminderSentAt) {
      carRows.push(
        buildRow({
          entityType: NotificationEntityType.CAR,
          docType: NotificationDocType.REGISTRATION,
          kind: NotificationKind.PRE_EXPIRY,
          targetDate: c.registrationExpiryDate,
          sentAt: c.licenseReminderSentAt,
          carId: c.id,
        }),
      );
    }
  }

  if (carRows.length > 0) {
    const result = await prisma.notification.createMany({
      data: carRows,
      skipDuplicates: true,
    });
    console.log(`[backfill] Car notifications inserted: ${result.count}`);
    total += result.count;
  }

  // ─── Maintenance ──────────────────────────────────────────────────────────

  const maintenance = await prisma.$queryRaw`
    SELECT
      id,
      start_at AS "startAt",
      end_at AS "endAt",
      start_reminder_sent_at AS "startReminderSentAt",
      end_reminder_sent_at AS "endReminderSentAt",
      maintenance_completed_notification_sent_at AS "maintenanceCompletedNotificationSentAt"
    FROM car_maintenance_history
    WHERE start_reminder_sent_at IS NOT NULL
       OR end_reminder_sent_at IS NOT NULL
       OR maintenance_completed_notification_sent_at IS NOT NULL
  `;

  const maintRows = [];
  for (const m of maintenance) {
    if (m.startReminderSentAt) {
      maintRows.push(
        buildRow({
          entityType: NotificationEntityType.MAINTENANCE,
          docType: NotificationDocType.MAINT_START,
          kind: NotificationKind.MAINT_PRE,
          targetDate: m.startAt,
          sentAt: m.startReminderSentAt,
          maintenanceId: m.id,
        }),
      );
    }
    if (m.endReminderSentAt) {
      maintRows.push(
        buildRow({
          entityType: NotificationEntityType.MAINTENANCE,
          docType: NotificationDocType.MAINT_END,
          kind: NotificationKind.MAINT_PRE,
          targetDate: m.endAt,
          sentAt: m.endReminderSentAt,
          maintenanceId: m.id,
        }),
      );
    }
    if (m.maintenanceCompletedNotificationSentAt) {
      maintRows.push(
        buildRow({
          entityType: NotificationEntityType.MAINTENANCE,
          docType: NotificationDocType.MAINT_DUE,
          kind: NotificationKind.MAINT_DUE,
          targetDate: m.endAt,
          sentAt: m.maintenanceCompletedNotificationSentAt,
          maintenanceId: m.id,
        }),
      );
    }
  }

  if (maintRows.length > 0) {
    const result = await prisma.notification.createMany({
      data: maintRows,
      skipDuplicates: true,
    });
    console.log(`[backfill] Maintenance notifications inserted: ${result.count}`);
    total += result.count;
  }

  console.log(`[backfill] Done. Total rows inserted: ${total}`);
};

run()
  .catch((err) => {
    console.error("[backfill] Fatal:", err.message);
    process.exit(1);
  })
  .finally(() => disconnectPrisma());
