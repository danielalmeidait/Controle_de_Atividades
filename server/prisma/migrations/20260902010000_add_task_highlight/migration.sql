-- AlterTable
ALTER TABLE "Task" ADD COLUMN "isHighlight" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Task" ADD COLUMN "highlightColor" TEXT;
