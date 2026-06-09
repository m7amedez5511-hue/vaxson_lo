/*
  Warnings:

  - You are about to drop the `CarImages` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CarImages" DROP CONSTRAINT "CarImages_car_id_fkey";

-- DropTable
DROP TABLE "CarImages";

-- CreateTable
CREATE TABLE "car_images" (
    "id" TEXT NOT NULL,
    "car_id" TEXT NOT NULL,
    "maintenance_id" TEXT,
    "image" TEXT NOT NULL,
    "public_id" TEXT,
    "stage" TEXT DEFAULT 'GENERAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "car_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "car_images" ADD CONSTRAINT "car_images_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "car_maintenance_history"("id") ON DELETE SET NULL ON UPDATE CASCADE;
