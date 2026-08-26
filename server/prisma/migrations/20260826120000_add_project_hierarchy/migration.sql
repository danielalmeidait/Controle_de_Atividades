-- AlterTable
ALTER TABLE "Task" ADD COLUMN "initiativeId" INTEGER;

-- CreateTable
CREATE TABLE "BusinessArea" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "responsible" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Initiative" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'initiative',
    "parentId" INTEGER,
    "description" TEXT NOT NULL DEFAULT '',
    "theme" TEXT,
    "system" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "startDate" DATETIME,
    "targetDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Initiative_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Initiative" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Initiative" ("createdAt", "id", "name", "startDate", "status", "system", "targetDate", "theme", "updatedAt") SELECT "createdAt", "id", "name", "startDate", "status", "system", "targetDate", "theme", "updatedAt" FROM "Initiative";
DROP TABLE "Initiative";
ALTER TABLE "new_Initiative" RENAME TO "Initiative";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "BusinessArea_name_key" ON "BusinessArea"("name");
