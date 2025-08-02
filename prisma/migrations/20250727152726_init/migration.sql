-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT
);

-- CreateTable
CREATE TABLE "Post" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" INTEGER NOT NULL,
    CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hanzi" TEXT NOT NULL,
    "strokeOrder" TEXT NOT NULL DEFAULT '',
    "keyword" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "isOneCharacterWord" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "MovieAudio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_MovieToMovieAudio" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_MovieToMovieAudio_A_fkey" FOREIGN KEY ("A") REFERENCES "Movie" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_MovieToMovieAudio_B_fkey" FOREIGN KEY ("B") REFERENCES "MovieAudio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MovieAudio_filename_key" ON "MovieAudio"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "_MovieToMovieAudio_AB_unique" ON "_MovieToMovieAudio"("A", "B");

-- CreateIndex
CREATE INDEX "_MovieToMovieAudio_B_index" ON "_MovieToMovieAudio"("B");
