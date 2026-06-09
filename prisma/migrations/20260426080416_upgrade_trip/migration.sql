/*
  Warnings:

  - A unique constraint covering the columns `[trip_number]` on the table `trips` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "branch_id" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "trip_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "trips_trip_number_key" ON "trips"("trip_number");

-- CreateIndex
CREATE INDEX "trips_branch_id_idx" ON "trips"("branch_id");

-- CreateIndex
CREATE INDEX "trips_trip_number_idx" ON "trips"("trip_number");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
