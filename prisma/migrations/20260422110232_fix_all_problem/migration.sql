-- CreateIndex
CREATE INDEX "branches_name_idx" ON "branches"("name");

-- CreateIndex
CREATE INDEX "branches_email_idx" ON "branches"("email");

-- CreateIndex
CREATE INDEX "branches_phone_idx" ON "branches"("phone");

-- CreateIndex
CREATE INDEX "cars_registration_number_idx" ON "cars"("registration_number");

-- CreateIndex
CREATE INDEX "cars_vin_number_idx" ON "cars"("vin_number");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_phone_idx" ON "clients"("phone");

-- CreateIndex
CREATE INDEX "drivers_user_name_idx" ON "drivers"("user_name");

-- CreateIndex
CREATE INDEX "drivers_email_idx" ON "drivers"("email");

-- CreateIndex
CREATE INDEX "drivers_national_id_idx" ON "drivers"("national_id");

-- CreateIndex
CREATE INDEX "drivers_phone_idx" ON "drivers"("phone");

-- CreateIndex
CREATE INDEX "orders_recipient_phone_idx" ON "orders"("recipient_phone");

-- CreateIndex
CREATE INDEX "orders_shipment_number_idx" ON "orders"("shipment_number");

-- CreateIndex
CREATE INDEX "permissions_slug_idx" ON "permissions"("slug");

-- CreateIndex
CREATE INDEX "roles_name_idx" ON "roles"("name");
