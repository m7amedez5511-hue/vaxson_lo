/*
  Migration B:
  Drop legacy reminder flags after backfill-notifications script runs.
*/

-- AlterTable
ALTER TABLE "car_maintenance_history"
DROP COLUMN "endReminderSentAt",
DROP COLUMN "maintenanceCompletedNotificationSentAt",
DROP COLUMN "startReminderSentAt";

-- AlterTable
ALTER TABLE "cars"
DROP COLUMN "insuranceReminderSentAt",
DROP COLUMN "insuranceSecondReminderSentAt",
DROP COLUMN "licenseReminderSentAt",
DROP COLUMN "licenseSecondReminderSentAt";

-- AlterTable
ALTER TABLE "drivers"
DROP COLUMN "identityReminderSentAt",
DROP COLUMN "identitySecondReminderSentAt",
DROP COLUMN "licenseReminderSentAt",
DROP COLUMN "licenseSecondReminderSentAt";
