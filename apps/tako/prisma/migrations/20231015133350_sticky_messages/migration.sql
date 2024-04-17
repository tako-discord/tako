-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "sticky_message" TEXT,
    "sticky_embed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_id_key" ON "Channel"("id");
