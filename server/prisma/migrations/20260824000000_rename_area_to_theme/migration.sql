-- CreateTable
CREATE TABLE "Theme" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Copy Data from Area to Theme
INSERT INTO "Theme" ("id", "name", "createdAt") SELECT "id", "name", "createdAt" FROM "Area";

-- DropTable
DROP TABLE "Area";

-- Recreate unique index
CREATE UNIQUE INDEX "Theme_name_key" ON "Theme"("name");

-- AlterTable Task
ALTER TABLE "Task" RENAME COLUMN "area" TO "theme";
ALTER TABLE "Task" ADD COLUMN "deliveryId" INTEGER;
ALTER TABLE "Task" ADD COLUMN "position" REAL;

-- CreateTable
CREATE TABLE "Initiative" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "theme" TEXT,
    "system" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "startDate" DATETIME,
    "targetDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Delivery" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "initiativeId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startDate" DATETIME,
    "targetDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
