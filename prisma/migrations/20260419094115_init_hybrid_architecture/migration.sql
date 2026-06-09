/*
  Warnings:

  - You are about to drop the column `address` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_additional_no` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_building_no` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_city` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_district` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_street` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_unit_no` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `delivery_zip` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `is_national_address_validated` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_additional_no` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_building_no` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_city` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_district` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_street` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_unit_no` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_zip` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `sender_name` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "client_type" SET DEFAULT 'Corporate';

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "delivery_additional_no",
DROP COLUMN "delivery_building_no",
DROP COLUMN "delivery_city",
DROP COLUMN "delivery_district",
DROP COLUMN "delivery_street",
DROP COLUMN "delivery_unit_no",
DROP COLUMN "delivery_zip",
DROP COLUMN "is_national_address_validated",
DROP COLUMN "pickup_additional_no",
DROP COLUMN "pickup_building_no",
DROP COLUMN "pickup_city",
DROP COLUMN "pickup_district",
DROP COLUMN "pickup_street",
DROP COLUMN "pickup_unit_no",
DROP COLUMN "pickup_zip",
DROP COLUMN "sender_name",
ADD COLUMN     "delivery_address_id" TEXT,
ADD COLUMN     "pickup_address_id" TEXT;
