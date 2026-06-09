/*
  Warnings:

  - Made the column `title` on table `trips` required. This step will fail if there are existing NULL values in that column.
  - Made the column `trip_number` on table `trips` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "trips" ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "trip_number" SET NOT NULL;
