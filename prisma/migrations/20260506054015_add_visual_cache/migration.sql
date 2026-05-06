-- CreateTable
CREATE TABLE "ProblemVisualCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leetcodeNumber" INTEGER NOT NULL,
    "problemTitle" TEXT NOT NULL,
    "visualJson" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ProblemVisualCache_leetcodeNumber_key" ON "ProblemVisualCache"("leetcodeNumber");
