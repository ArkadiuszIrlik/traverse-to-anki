-- CreateTable
CREATE TABLE "Sentence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "text" TEXT NOT NULL,
    "highlightStartIndex" INTEGER NOT NULL,
    "highlightEndIndex" INTEGER NOT NULL,
    "highlightMeaning" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '',
    "personalNotes" TEXT NOT NULL DEFAULT ''
);

-- CreateTable
CREATE TABLE "SentenceAudio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_SentenceToSentenceAudio" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_SentenceToSentenceAudio_A_fkey" FOREIGN KEY ("A") REFERENCES "Sentence" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SentenceToSentenceAudio_B_fkey" FOREIGN KEY ("B") REFERENCES "SentenceAudio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SentenceAudio_filename_key" ON "SentenceAudio"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "_SentenceToSentenceAudio_AB_unique" ON "_SentenceToSentenceAudio"("A", "B");

-- CreateIndex
CREATE INDEX "_SentenceToSentenceAudio_B_index" ON "_SentenceToSentenceAudio"("B");
