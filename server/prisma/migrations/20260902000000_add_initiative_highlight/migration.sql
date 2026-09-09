-- AlterTable
ALTER TABLE "Initiative" ADD COLUMN "isHighlight" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Initiative" ADD COLUMN "highlightColor" TEXT;
