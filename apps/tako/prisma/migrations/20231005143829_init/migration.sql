-- CreateEnum
CREATE TYPE "ReplyStyle" AS ENUM ('minWebhook', 'embed');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "uuid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "license" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "color" INTEGER,
    "autoRolesUser" TEXT[],
    "autoRolesBot" TEXT[],
    "autotranslate" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'en',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "replyStyle" "ReplyStyle" NOT NULL DEFAULT 'minWebhook',
    "deleteOriginal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_uuid_key" ON "User"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Guild_id_key" ON "Guild"("id");
