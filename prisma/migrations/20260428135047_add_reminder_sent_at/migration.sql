-- AlterTable
ALTER TABLE "car_maintenance_history" ADD COLUMN     "endReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "startReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "cars" ADD COLUMN     "insuranceReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "licenseReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "maintenanceEndReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "maintenanceStartReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "identityReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "licenseReminderSentAt" TIMESTAMP(3);
