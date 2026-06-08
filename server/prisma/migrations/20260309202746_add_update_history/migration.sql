-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "requester" TEXT NOT NULL,
    "criticality" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "deadline" TEXT NOT NULL,
    "requestDate" TEXT NOT NULL,
    "checklist" TEXT NOT NULL,
    "lastUpdate" TEXT NOT NULL,
    "updateHistory" TEXT NOT NULL DEFAULT '[]',
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Task" ("area", "checklist", "createdAt", "criticality", "deadline", "description", "id", "lastUpdate", "name", "requestDate", "requester", "status", "system", "type", "updatedAt") SELECT "area", "checklist", "createdAt", "criticality", "deadline", "description", "id", "lastUpdate", "name", "requestDate", "requester", "status", "system", "type", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
