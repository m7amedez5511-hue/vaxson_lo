/*
  Warnings:

  - You are about to drop the column `maintenanceEndReminderSentAt` on the `cars` table. All the data in the column will be lost.
  - You are about to drop the column `maintenanceStartReminderSentAt` on the `cars` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "cars" DROP COLUMN "maintenanceEndReminderSentAt",
DROP COLUMN "maintenanceStartReminderSentAt";

-- CreateTable
CREATE TABLE "CarImages" (
    "id" TEXT NOT NULL,
    "car_id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "public_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarImages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CarImages" ADD CONSTRAINT "CarImages_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
