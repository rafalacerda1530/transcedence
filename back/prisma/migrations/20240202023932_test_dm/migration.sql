-- AlterEnum
ALTER TYPE "GroupStatus" ADD VALUE 'DIRECT';

-- DropForeignKey
ALTER TABLE "GroupMembership" DROP CONSTRAINT "GroupMembership_groupId_fkey";

-- AlterTable
ALTER TABLE "GroupMembership" ADD COLUMN     "groupDMId" INTEGER,
ALTER COLUMN "groupId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "groupDMId" INTEGER;

-- CreateTable
CREATE TABLE "GroupDM" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GroupStatus" NOT NULL,

    CONSTRAINT "GroupDM_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupDM_name_key" ON "GroupDM"("name");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_groupDMId_fkey" FOREIGN KEY ("groupDMId") REFERENCES "GroupDM"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupDMId_fkey" FOREIGN KEY ("groupDMId") REFERENCES "GroupDM"("id") ON DELETE SET NULL ON UPDATE CASCADE;
