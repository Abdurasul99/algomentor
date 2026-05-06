-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "overview" TEXT NOT NULL,
    "intuition" TEXT NOT NULL,
    "whenToUse" TEXT NOT NULL,
    "recognitionSignals" TEXT NOT NULL,
    "commonMistakes" TEXT NOT NULL,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'Beginner',
    "orderIndex" INTEGER NOT NULL,
    "prerequisites" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LessonContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonContent_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeProblem" (
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
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PracticeProblem_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProblemAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "ProblemAttempt_practiceProblemId_fkey" FOREIGN KEY ("practiceProblemId") REFERENCES "PracticeProblem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "problemAttemptId" TEXT NOT NULL,
    "reviewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousConfidence" INTEGER NOT NULL,
    "newConfidence" INTEGER NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "ReviewLog_problemAttemptId_fkey" FOREIGN KEY ("problemAttemptId") REFERENCES "ProblemAttempt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleId" TEXT NOT NULL,
    "questionType" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "difficultyLevel" TEXT NOT NULL DEFAULT 'Beginner',
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuizQuestion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizQuestionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "QuizOption_quizQuestionId_fkey" FOREIGN KEY ("quizQuestionId") REFERENCES "QuizQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FillGapAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizQuestionId" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    CONSTRAINT "FillGapAnswer_quizQuestionId_fkey" FOREIGN KEY ("quizQuestionId") REFERENCES "QuizQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quizQuestionId" TEXT NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "attemptMode" TEXT NOT NULL DEFAULT 'Practice',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuizAttempt_quizQuestionId_fkey" FOREIGN KEY ("quizQuestionId") REFERENCES "QuizQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ModuleProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "ModuleProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "problemsSolved" INTEGER NOT NULL DEFAULT 0,
    "quizzesTaken" INTEGER NOT NULL DEFAULT 0,
    "minutesSpent" INTEGER NOT NULL DEFAULT 0,
    "modulesWorked" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Module_slug_key" ON "Module"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleProgress_moduleId_key" ON "ModuleProgress"("moduleId");
