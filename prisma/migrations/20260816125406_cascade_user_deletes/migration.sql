-- DropForeignKey
ALTER TABLE "Opportunity" DROP CONSTRAINT "Opportunity_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Target" DROP CONSTRAINT "Target_user_id_fkey";

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
