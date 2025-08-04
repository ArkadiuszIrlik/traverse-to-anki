-- CreateTable
CREATE TABLE "Prop" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "component" TEXT NOT NULL,
    "prop" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Prop_component_key" ON "Prop"("component");
