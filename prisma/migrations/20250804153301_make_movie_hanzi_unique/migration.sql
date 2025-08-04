/*
  Warnings:

  - A unique constraint covering the columns `[hanzi]` on the table `Movie` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Movie_hanzi_key" ON "Movie"("hanzi");
