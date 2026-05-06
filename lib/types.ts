export type ModuleStatus = "NotStarted" | "InProgress" | "Completed" | "Mastered";
export type ProblemStatus = "NotStarted" | "InProgress" | "Solved" | "Mastered" | "Retry";
export type Difficulty = "Beginner" | "Easy" | "Medium" | "Hard";
export type QuestionType = "MultipleChoice" | "FillInTheGap" | "TrueFalse" | "ConceptCheck";
export type MistakeType =
  | "PatternNotRecognized"
  | "ImplementationBug"
  | "EdgeCaseMissed"
  | "TimeComplexityMiss"
  | "PointerOrIndexIssue"
  | "CouldNotExplain"
  | "PanickedUnderTime"
  | "NeedMoreRepetition"
  | "";

export interface MentorRecommendation {
  type: "warning" | "suggestion" | "encouragement" | "action";
  message: string;
  action?: string;
  actionHref?: string;
}

export interface ModuleWithProgress {
  id: string;
  name: string;
  slug: string;
  description: string;
  difficultyLevel: string;
  orderIndex: number;
  prerequisites: string;
  moduleProgress: {
    status: string;
    quizScore: number;
    practiceScore: number;
    masteryScore: number;
    confidenceAverage: number;
    theoryCompleted: boolean;
    hintDependencyScore: number;
    reviewDueDate: Date | null;
  } | null;
}
