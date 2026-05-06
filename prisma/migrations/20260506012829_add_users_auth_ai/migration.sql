/*
  Warnings:

  - Added the required column `userId` to the `DailyActivity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ModuleProgress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ProblemAttempt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `QuizAttempt` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatarUrl" TEXT NOT NULL DEFAULT '',
    "goal" TEXT NOT NULL DEFAULT 'Get a job at a top tech company',
    "experienceLevel" TEXT NOT NULL DEFAULT 'Beginner',
    "targetCompanies" TEXT NOT NULL DEFAULT '[]',
    "leetcodeUsername" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LeetCodeProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "totalSolved" INTEGER NOT NULL DEFAULT 0,
    "easySolved" INTEGER NOT NULL DEFAULT 0,
    "mediumSolved" INTEGER NOT NULL DEFAULT 0,
    "hardSolved" INTEGER NOT NULL DEFAULT 0,
    "ranking" INTEGER NOT NULL DEFAULT 0,
    "contestRating" INTEGER NOT NULL DEFAULT 0,
    "lastSynced" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeetCodeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudyPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planJson" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "problemsSolved" INTEGER NOT NULL DEFAULT 0,
    "quizzesTaken" INTEGER NOT NULL DEFAULT 0,
    "minutesSpent" INTEGER NOT NULL DEFAULT 0,
    "modulesWorked" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyActivity" ("createdAt", "date", "id", "minutesSpent", "modulesWorked", "problemsSolved", "quizzesTaken") SELECT "createdAt", "date", "id", "minutesSpent", "modulesWorked", "problemsSolved", "quizzesTaken" FROM "DailyActivity";
DROP TABLE "DailyActivity";
ALTER TABLE "new_DailyActivity" RENAME TO "DailyActivity";
CREATE TABLE "new_ModuleProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "theoryCompleted" BOOLEAN NOT NULL DEFAULT false,
    "conceptScore" REAL NOT NULL DEFAULT 0,
    "quizScore" REAL NOT NULL DEFAULT 0,
    "practiceScore" REAL NOT NULL DEFAULT 0,
    "masteryScore" REAL NOT NULL DEFAULT 0,
    "confidenceAverage" REAL NOT NULL DEFAULT 0,
    "explanationScore" REAL NOT NULL DEFAULT 0,
    "hintDependencyScore" REAL NOT NULL DEFAULT 0,
    "reviewDueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NotStarted',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ModuleProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ModuleProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ModuleProgress" ("conceptScore", "confidenceAverage", "explanationScore", "hintDependencyScore", "id", "masteryScore", "moduleId", "practiceScore", "quizScore", "reviewDueDate", "status", "theoryCompleted", "updatedAt") SELECT "conceptScore", "confidenceAverage", "explanationScore", "hintDependencyScore", "id", "masteryScore", "moduleId", "practiceScore", "quizScore", "reviewDueDate", "status", "theoryCompleted", "updatedAt" FROM "ModuleProgress";
DROP TABLE "ModuleProgress";
ALTER TABLE "new_ModuleProgress" RENAME TO "ModuleProgress";
CREATE UNIQUE INDEX "ModuleProgress_userId_moduleId_key" ON "ModuleProgress"("userId", "moduleId");
CREATE TABLE "new_PracticeProblem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "difficulty" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "learningObjective" TEXT NOT NULL,
    "hintLevelOne" TEXT NOT NULL,
    "hintLevelTwo" TEXT NOT NULL,
    "hintLevelThree" TEXT NOT NULL,
    "hintLevelFour" TEXT NOT NULL,
    "finalExplanation" TEXT NOT NULL,
    "companies" TEXT NOT NULL DEFAULT '[]',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PracticeProblem_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PracticeProblem" ("createdAt", "description", "difficulty", "finalExplanation", "hintLevelFour", "hintLevelOne", "hintLevelThree", "hintLevelTwo", "id", "learningObjective", "moduleId", "orderIndex", "source", "title", "updatedAt", "url") SELECT "createdAt", "description", "difficulty", "finalExplanation", "hintLevelFour", "hintLevelOne", "hintLevelThree", "hintLevelTwo", "id", "learningObjective", "moduleId", "orderIndex", "source", "title", "updatedAt", "url" FROM "PracticeProblem";
DROP TABLE "PracticeProblem";
ALTER TABLE "new_PracticeProblem" RENAME TO "PracticeProblem";
CREATE TABLE "new_ProblemAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "practiceProblemId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NotStarted',
    "minutesSpent" INTEGER NOT NULL DEFAULT 0,
    "hintUsedLevel" INTEGER NOT NULL DEFAULT 0,
    "solvedIndependently" BOOLEAN NOT NULL DEFAULT false,
    "canExplainClearly" BOOLEAN NOT NULL DEFAULT false,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "mistakeType" TEXT NOT NULL DEFAULT '',
    "keyInsight" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "revisitDate" DATETIME,
    "lastReviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProblemAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProblemAttempt_practiceProblemId_fkey" FOREIGN KEY ("practiceProblemId") REFERENCES "PracticeProblem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProblemAttempt" ("canExplainClearly", "confidenceScore", "createdAt", "hintUsedLevel", "id", "keyInsight", "lastReviewedAt", "minutesSpent", "mistakeType", "notes", "practiceProblemId", "revisitDate", "solvedIndependently", "status", "updatedAt") SELECT "canExplainClearly", "confidenceScore", "createdAt", "hintUsedLevel", "id", "keyInsight", "lastReviewedAt", "minutesSpent", "mistakeType", "notes", "practiceProblemId", "revisitDate", "solvedIndependently", "status", "updatedAt" FROM "ProblemAttempt";
DROP TABLE "ProblemAttempt";
ALTER TABLE "new_ProblemAttempt" RENAME TO "ProblemAttempt";
CREATE TABLE "new_QuizAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "quizQuestionId" TEXT NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "attemptMode" TEXT NOT NULL DEFAULT 'Practice',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuizAttempt_quizQuestionId_fkey" FOREIGN KEY ("quizQuestionId") REFERENCES "QuizQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuizAttempt" ("attemptMode", "createdAt", "id", "isCorrect", "quizQuestionId", "selectedAnswer") SELECT "attemptMode", "createdAt", "id", "isCorrect", "quizQuestionId", "selectedAnswer" FROM "QuizAttempt";
DROP TABLE "QuizAttempt";
ALTER TABLE "new_QuizAttempt" RENAME TO "QuizAttempt";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LeetCodeProfile_userId_key" ON "LeetCodeProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudyPlan_userId_key" ON "StudyPlan"("userId");
