/*
  Warnings:

  - Added the required column `highlightText` to the `Sentence` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Sentence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "highlightStartIndex" INTEGER NOT NULL,
    "highlightEndIndex" INTEGER NOT NULL,
    "highlightText" TEXT NOT NULL,
    "highlightMeaning" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '',
    "personalNotes" TEXT NOT NULL DEFAULT ''
);
INSERT INTO "new_Sentence" ("context", "highlightEndIndex", "highlightMeaning", "highlightStartIndex", "id", "personalNotes", "text") SELECT "context", "highlightEndIndex", "highlightMeaning", "highlightStartIndex", "id", "personalNotes", "text" FROM "Sentence";
DROP TABLE "Sentence";
ALTER TABLE "new_Sentence" RENAME TO "Sentence";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
