/*
  Warnings:

  - You are about to drop the `client_addresses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "client_addresses" DROP CONSTRAINT "client_addresses_client_id_fkey";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "user_name" DROP NOT NULL;

-- DropTable
DROP TABLE "client_addresses";

-- CreateTable
CREATE TABLE "driver_status_history" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "status" "DriverStatus" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "driver_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable (DriverStatusHistory)
-- Index exists from previous migrations, skipping recreation of user_email_active_idx

-- AddForeignKey
ALTER TABLE "driver_status_history" ADD CONSTRAINT "driver_status_history_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
