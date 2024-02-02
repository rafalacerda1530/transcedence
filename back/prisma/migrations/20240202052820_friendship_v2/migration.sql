/*
  Warnings:

  - Added the required column `friendshipStatus` to the `Friendship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Friendship" ADD COLUMN     "friendshipStatus" INTEGER NOT NULL;
