-- CreateTable
CREATE TABLE "ScrapedDeck" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "firstScrapeTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastScrapeTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ScrapedDeck_name_key" ON "ScrapedDeck"("name");
