-- AlterTable
ALTER TABLE "cars" ADD COLUMN     "impound_status" TEXT;

-- RenameIndex
ALTER INDEX "branches_email_active_idx" RENAME TO "branches_email_key";

-- RenameIndex
ALTER INDEX "branches_name_active_idx" RENAME TO "branches_name_key";
