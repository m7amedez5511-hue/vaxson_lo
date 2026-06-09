/*
  Warnings:

  - A unique constraint covering the columns `[user_name]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "CarStatus" ADD VALUE 'InTrip';

-- AlterEnum
ALTER TYPE "DriverStatus" ADD VALUE 'InTrip';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "password" TEXT,
ADD COLUMN     "refresh_token" TEXT,
ADD COLUMN     "user_name" TEXT;

-- AlterTable
ALTER TABLE "drivers" ADD COLUMN     "refresh_token" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "refresh_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "clients_user_name_key" ON "clients"("user_name");
