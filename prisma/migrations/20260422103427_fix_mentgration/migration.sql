-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- RenameIndex
ALTER INDEX "client_email_active_idx" RENAME TO "clients_email_key";

-- RenameIndex
ALTER INDEX "user_email_active_idx" RENAME TO "users_email_key";
