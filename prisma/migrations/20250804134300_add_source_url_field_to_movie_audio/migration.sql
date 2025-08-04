/*
  Warnings:

  - Added the required column `sourceUrl` to the `MovieAudio` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MovieAudio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL
);
INSERT INTO "new_MovieAudio" ("filename", "id") SELECT "filename", "id" FROM "MovieAudio";
DROP TABLE "MovieAudio";
ALTER TABLE "new_MovieAudio" RENAME TO "MovieAudio";
CREATE UNIQUE INDEX "MovieAudio_filename_key" ON "MovieAudio"("filename");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
