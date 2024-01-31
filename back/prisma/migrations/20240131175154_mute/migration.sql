/*
  Warnings:

  - A unique constraint covering the columns `[userId,groupId]` on the table `Ban` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "Mute" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "expirationDate" TIMESTAMP(3),

    CONSTRAINT "Mute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mute_userId_groupId_key" ON "Mute"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "Ban_userId_groupId_key" ON "Ban"("userId", "groupId");

-- AddForeignKey
ALTER TABLE "Mute" ADD CONSTRAINT "Mute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mute" ADD CONSTRAINT "Mute_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
