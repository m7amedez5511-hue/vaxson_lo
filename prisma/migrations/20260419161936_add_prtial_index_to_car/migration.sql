-- Create partial unique index on registration_number for non-deleted cars
CREATE UNIQUE INDEX "car_registration_number_active_idx"
ON "cars"("registration_number")
WHERE "is_deleted" = false;

-- Create partial unique index on vin_number for non-deleted cars
CREATE UNIQUE INDEX "car_vin_number_active_idx"
ON "cars"("vin_number")
WHERE "is_deleted" = false;