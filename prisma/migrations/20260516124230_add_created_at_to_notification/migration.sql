/*
  Warnings:

  - Changed the type of `entity_type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `doc_type` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `kind` on the `notifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NotificationEntityType" AS ENUM ('DRIVER', 'CAR', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('PRE_EXPIRY', 'POST_EXPIRY', 'MAINT_PRE', 'MAINT_DUE');

-- CreateEnum
CREATE TYPE "NotificationDocType" AS ENUM ('NATIONAL_ID', 'LICENSE', 'INSURANCE', 'REGISTRATION', 'MAINT_START', 'MAINT_END', 'MAINT_DUE');

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_car_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_driver_id_fkey";

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_maintenance_id_fkey";

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "requeueCount" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "entity_type",
ADD COLUMN     "entity_type" "NotificationEntityType" NOT NULL,
DROP COLUMN "doc_type",
ADD COLUMN     "doc_type" "NotificationDocType" NOT NULL,
DROP COLUMN "kind",
ADD COLUMN     "kind" "NotificationKind" NOT NULL;

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_entity_type_entity_id_doc_type_kind_target_da_key" ON "notifications"("entity_type", "entity_id", "doc_type", "kind", "target_date");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "car_maintenance_history"("id") ON DELETE SET NULL ON UPDATE CASCADE;
