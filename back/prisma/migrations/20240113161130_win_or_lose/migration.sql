/*
  Warnings:

  - Changed the type of `outcome` on the `UserGameHistory` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "UserGameHistory" DROP COLUMN "outcome",
ADD COLUMN     "outcome" BOOLEAN NOT NULL;
