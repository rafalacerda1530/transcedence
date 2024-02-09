-- CreateIndex
CREATE INDEX "Group_name_idx" ON "Group"("name");

-- CreateIndex
CREATE INDEX "GroupDM_name_idx" ON "GroupDM"("name");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
