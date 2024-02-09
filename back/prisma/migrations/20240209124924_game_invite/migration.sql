/*
  Warnings:

  - Added the required column `gameInvite` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "gameInvite" BOOLEAN NOT NULL,
ADD COLUMN     "gameType" TEXT;
