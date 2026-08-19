/*
  Warnings:

  - You are about to drop the column `actual_premium_kshs` on the `Opportunity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Opportunity" DROP COLUMN "actual_premium_kshs",
ADD COLUMN     "intermediary" TEXT NOT NULL DEFAULT 'Direct',
ADD COLUMN     "pr_invoice_number" TEXT,
ADD COLUMN     "pr_verified_data" JSONB;
