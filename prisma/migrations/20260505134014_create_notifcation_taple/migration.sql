-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "target_date" DATE NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "sms_job_id" TEXT,
    "driver_id" TEXT,
    "car_id" TEXT,
    "maintenance_id" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_target_date_idx" ON "notifications"("target_date");

-- CreateIndex
CREATE INDEX "notifications_entity_id_idx" ON "notifications"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_entity_type_entity_id_doc_type_kind_target_da_key" ON "notifications"("entity_type", "entity_id", "doc_type", "kind", "target_date");

-- CreateIndex
CREATE INDEX "drivers_license_expiry_idx" ON "drivers"("license_expiry");

-- CreateIndex
CREATE INDEX "drivers_national_id_expiry_idx" ON "drivers"("national_id_expiry");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "cars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "car_maintenance_history"("id") ON DELETE CASCADE ON UPDATE CASCADE;
