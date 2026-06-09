-- CreateIndex
CREATE INDEX "car_maintenance_history_start_at_idx" ON "car_maintenance_history"("start_at");

-- CreateIndex
CREATE INDEX "car_maintenance_history_end_at_idx" ON "car_maintenance_history"("end_at");

-- CreateIndex
CREATE INDEX "cars_registration_expiry_date_idx" ON "cars"("registration_expiry_date");

-- CreateIndex
CREATE INDEX "cars_insurance_expiry_date_idx" ON "cars"("insurance_expiry_date");
