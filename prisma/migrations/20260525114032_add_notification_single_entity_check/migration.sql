-- Step 1: Drop the current wrong unique constraint
DROP INDEX IF EXISTS "notifications_entity_type_doc_type_kind_target_date_key";

-- Step 2: Drop old entity_id index if still exists
DROP INDEX IF EXISTS "notifications_entity_id_idx";

-- Step 3: Add the correct unique constraint (dedup per entity, not per entityType)
CREATE UNIQUE INDEX "notifications_entity_type_doc_type_kind_target_date_driver_car_maint_key"
ON "notifications"("entity_type", "doc_type", "kind", "target_date", "driver_id", "car_id", "maintenance_id");

-- Step 4: Ensure exactly one FK is non-null per notification row
ALTER TABLE notifications
ADD CONSTRAINT chk_notification_single_entity CHECK (
  (
    (driver_id IS NOT NULL)::int +
    (car_id IS NOT NULL)::int +
    (maintenance_id IS NOT NULL)::int
  ) = 1
);