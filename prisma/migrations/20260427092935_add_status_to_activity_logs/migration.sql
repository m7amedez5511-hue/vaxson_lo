-- AlterTable
ALTER TABLE "activity_logs" ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SUCCESS';
