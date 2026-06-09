-- 1. drop old indexes / keys to avoid collisions
DROP INDEX IF EXISTS "users_email_key";
DROP INDEX IF EXISTS "users_user_name_key";
DROP INDEX IF EXISTS "user_email_active_idx";
DROP INDEX IF EXISTS "user_user_name_active_idx";

DROP INDEX IF EXISTS "clients_email_key";
DROP INDEX IF EXISTS "clients_user_name_key";
DROP INDEX IF EXISTS "client_email_active_idx";
DROP INDEX IF EXISTS "client_user_name_active_idx";

DROP INDEX IF EXISTS "cars_registration_number_key";
DROP INDEX IF EXISTS "car_registration_number_active_idx";

DROP INDEX IF EXISTS "cars_vin_number_key";
DROP INDEX IF EXISTS "car_vin_number_active_idx";

DROP INDEX IF EXISTS "drivers_user_name_key";
DROP INDEX IF EXISTS "drivers_email_key";
DROP INDEX IF EXISTS "drivers_national_id_key";
DROP INDEX IF EXISTS "driver_user_name_active_idx";
DROP INDEX IF EXISTS "driver_email_active_idx";
DROP INDEX IF EXISTS "driver_national_id_active_idx";

DROP INDEX IF EXISTS "branches_name_key";
DROP INDEX IF EXISTS "branches_email_key";
DROP INDEX IF EXISTS "branch_name_active_idx";
DROP INDEX IF EXISTS "branch_email_active_idx";

DROP INDEX IF EXISTS "roles_name_key";
DROP INDEX IF EXISTS "role_name_active_idx";

DROP INDEX IF EXISTS "permissions_slug_key";
DROP INDEX IF EXISTS "permission_slug_active_idx";

DROP INDEX IF EXISTS "orders_shipment_number_key";
DROP INDEX IF EXISTS "order_shipment_number_active_idx";

DROP INDEX IF EXISTS "orders_tax_invoice_number_key";
DROP INDEX IF EXISTS "order_tax_invoice_number_active_idx";

-- 2. create partial unique indexes for users
CREATE UNIQUE INDEX "user_email_active_idx" ON "users"("email") WHERE "is_deleted" = false;
CREATE UNIQUE INDEX "user_user_name_active_idx" ON "users"("user_name") WHERE "is_deleted" = false;

-- 3. create partial unique indexes for clients     
CREATE UNIQUE INDEX "client_email_active_idx" ON "clients"("email") WHERE "is_deleted" = false;
CREATE UNIQUE INDEX "client_user_name_active_idx" ON "clients"("user_name") WHERE "is_deleted" = false;

-- 4. create partial unique indexes for cars
CREATE UNIQUE INDEX "car_registration_number_active_idx" ON "cars"("registration_number") WHERE "is_deleted" = false;
CREATE UNIQUE INDEX "car_vin_number_active_idx" ON "cars"("vin_number") WHERE "is_deleted" = false;

-- 5. create partial unique indexes for drivers
CREATE UNIQUE INDEX "driver_user_name_active_idx" ON "drivers"("user_name") WHERE "is_deleted" = false;
CREATE UNIQUE INDEX "driver_email_active_idx" ON "drivers"("email") WHERE "is_deleted" = false;
CREATE UNIQUE INDEX "driver_national_id_active_idx" ON "drivers"("national_id") WHERE "is_deleted" = false;

-- 6. create partial unique indexes for branches
CREATE UNIQUE INDEX "branch_name_active_idx" ON "branches"("name") WHERE "is_deleted" = false;
CREATE UNIQUE INDEX "branch_email_active_idx" ON "branches"("email") WHERE "is_deleted" = false;

-- 7. create partial unique indexes for roles & permissions
CREATE UNIQUE INDEX "role_name_active_idx" ON "roles"("name") WHERE "is_deleted" = false;
CREATE UNIQUE INDEX "permission_slug_active_idx" ON "permissions"("slug") WHERE "is_deleted" = false;

-- 8. create partial unique indexes for orders
CREATE UNIQUE INDEX "order_shipment_number_active_idx" ON "orders"("shipment_number") WHERE "is_deleted" = false;
CREATE UNIQUE INDEX "order_tax_invoice_number_active_idx" ON "orders"("tax_invoice_number") WHERE "is_deleted" = false AND "tax_invoice_number" IS NOT NULL;
