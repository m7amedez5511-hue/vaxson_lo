-- AlterTable
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;

-- drop indexes
DROP INDEX IF EXISTS "drivers_phone_idx";
DROP INDEX IF EXISTS "users_phone_idx";
DROP INDEX IF EXISTS "clients_phone_idx";

-- create partial unique indexes for drivers
CREATE UNIQUE INDEX "driver_phone_active_idx" ON "drivers"("phone") WHERE "is_deleted" = false;

-- create partial unique indexes for users
CREATE UNIQUE INDEX "user_phone_active_idx" ON "users"("phone") WHERE "is_deleted" = false;

-- create partial unique indexes for clients
CREATE UNIQUE INDEX "client_phone_active_idx" ON "clients"("phone") WHERE "is_deleted" = false;
