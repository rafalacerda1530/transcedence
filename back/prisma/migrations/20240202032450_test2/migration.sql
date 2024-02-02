-- DropForeignKey
ALTER TABLE "GroupMembership" DROP CONSTRAINT "GroupMembership_groupDMId_fkey";

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupDMId_fkey" FOREIGN KEY ("groupDMId") REFERENCES "GroupDM"("id") ON DELETE CASCADE ON UPDATE CASCADE;
