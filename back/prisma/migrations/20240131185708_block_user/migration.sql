-- CreateTable
CREATE TABLE "Block" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "blockedUserId" INTEGER NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Block_userId_blockedUserId_key" ON "Block"("userId", "blockedUserId");

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
