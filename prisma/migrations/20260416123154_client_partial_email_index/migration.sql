-- Create partial unique index on email for non-deleted clients
CREATE UNIQUE INDEX "client_email_active_idx"
ON "clients"("email")
WHERE "is_deleted" = false;