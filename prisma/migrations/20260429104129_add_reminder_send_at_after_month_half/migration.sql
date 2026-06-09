-- AlterTable
ALTER TABLE "car_maintenance_history" ADD COLUMN     "maintenanceCompletedNotificationSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "cars" ADD COLUMN     "insuranceSecondReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "licenseSecondReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "identitySecondReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "licenseSecondReminderSentAt" TIMESTAMP(3);
