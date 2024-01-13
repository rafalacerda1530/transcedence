-- CreateTable
CREATE TABLE "UserGameHistory" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "outcome" TEXT NOT NULL,

    CONSTRAINT "UserGameHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "unique_user_game" ON "UserGameHistory"("userId", "gameId");

-- AddForeignKey
ALTER TABLE "UserGameHistory" ADD CONSTRAINT "UserGameHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
