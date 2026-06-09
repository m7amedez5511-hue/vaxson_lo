-- Create partial unique index on email for non-deleted users
-- This allows multiple deleted users to have the same email, but only one active user per email
CREATE UNIQUE INDEX "user_email_active_idx" ON "users"("email") WHERE "is_deleted" = false;
