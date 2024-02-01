-- CreateTable
CREATE TABLE "GroupInvite" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "groupId" INTEGER NOT NULL,
    "invitedUserId" INTEGER NOT NULL,
    "invitedByUserId" INTEGER NOT NULL,

    CONSTRAINT "GroupInvite_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupInvite" ADD CONSTRAINT "GroupInvite_invitedByUserId_fkey" FOREIGN KEY ("invitedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
