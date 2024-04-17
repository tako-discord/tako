/*
  Warnings:

  - You are about to drop the column `sticky_embed` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `sticky_message` on the `Channel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "sticky_embed",
DROP COLUMN "sticky_message",
ADD COLUMN     "stickyEmbed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stickyMessage" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "quickTranslateTooltip" BOOLEAN NOT NULL DEFAULT true;
