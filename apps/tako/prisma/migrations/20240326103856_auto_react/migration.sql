-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "autoReact" TEXT[] DEFAULT ARRAY[]::TEXT[];
