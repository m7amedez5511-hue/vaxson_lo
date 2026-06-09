/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `branches` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `branches` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `city` to the `branches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `branches` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "branches" ADD COLUMN     "building_no" TEXT,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'SA',
ADD COLUMN     "district" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "street" TEXT NOT NULL,
ADD COLUMN     "unit_no" TEXT,
ADD COLUMN     "zip_code" TEXT;

-- Create partial unique index on name for non-deleted branches
CREATE UNIQUE INDEX "branches_name_active_idx"
ON "branches"("name")
WHERE "is_deleted" = false;

-- Create partial unique index on email for non-deleted branches
CREATE UNIQUE INDEX "branches_email_active_idx"
ON "branches"("email")
WHERE "is_deleted" = false;