ALTER TABLE "role_permissions" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "role_permissions" ADD COLUMN "deleted_at" TIMESTAMP(3);
