-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('UNRECONCILED', 'VERIFIED', 'REJECTED', 'FLAGGED');

-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "actual_premium_kshs" DOUBLE PRECISION,
ADD COLUMN     "reconciliation_notes" TEXT,
ADD COLUMN     "reconciliation_status" "ReconciliationStatus" NOT NULL DEFAULT 'UNRECONCILED';
