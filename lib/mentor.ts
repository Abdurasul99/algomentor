import type { MentorRecommendation, ModuleWithProgress } from "./types";

export interface LearningState {
  modules: ModuleWithProgress[];
  totalProblems: number;
  solvedProblems: number;
  dueReviews: number;
  overdueReviews: number;
  averageConfidence: number;
  recentQuizAccuracy: number;
  hintDependencyAvg: number;
}

export function generateMentorRecommendations(
  state: LearningState
): MentorRecommendation[] {
  const recs: MentorRecommendation[] = [];

  // Overdue review debt warning
  if (state.overdueReviews > 3) {
    recs.push({
      type: "warning",
      message: `You have ${state.overdueReviews} overdue reviews. Avoid starting new modules until you clear your review queue — spaced repetition only works if you keep up.`,
      action: "Go to Review Queue",
      actionHref: "/review",
    });
  } else if (state.dueReviews > 0) {
    recs.push({
      type: "action",
      message: `${state.dueReviews} review${state.dueReviews > 1 ? "s" : ""} due today. Spend 10 minutes reviewing before taking on new problems.`,
      action: "Review Now",
      actionHref: "/review",
    });
  }

  // Find weakest module
  const startedModules = state.modules.filter(
    (m) => m.moduleProgress && m.moduleProgress.status !== "NotStarted"
  );

  if (startedModules.length > 0) {
    const weakest = startedModules.reduce((prev, curr) => {
      const prevScore = (prev.moduleProgress?.masteryScore ?? 0);
      const currScore = (curr.moduleProgress?.masteryScore ?? 0);
      return currScore < prevScore ? curr : prev;
    });

    if ((weakest.moduleProgress?.masteryScore ?? 0) < 40) {
      recs.push({
        type: "suggestion",
        message: `Your weakest area is ${weakest.name} with a mastery score of ${Math.round(weakest.moduleProgress?.masteryScore ?? 0)}%. Revisit theory and concept checks before adding more problems.`,
        action: `Go to ${weakest.name}`,
        actionHref: `/modules/${weakest.slug}`,
      });
    }
  }

  // Hint dependency warning
  if (state.hintDependencyAvg > 70) {
    recs.push({
      type: "warning",
      message: `Your hint dependency is high (${Math.round(state.hintDependencyAvg)}%). You are relying on hints too much. Revisit concept checks before attempting new problems.`,
      action: "Take Quiz",
      actionHref: "/quiz",
    });
  }

  // Low confidence encouragement
  if (state.averageConfidence < 40 && startedModules.length > 0) {
    recs.push({
      type: "encouragement",
      message: `Your average confidence is ${Math.round(state.averageConfidence)}%. This is normal for beginners. Focus on one module at a time and review theory before practice.`,
    });
  }

  // Suggest next module to start
  const notStarted = state.modules
    .filter((m) => !m.moduleProgress || m.moduleProgress.status === "NotStarted")
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const completedSlugs = state.modules
    .filter((m) => m.moduleProgress?.status === "Mastered" || m.moduleProgress?.status === "Completed")
    .map((m) => m.slug);

  if (notStarted.length > 0) {
    const next = notStarted.find((m) => {
      const prereqs = JSON.parse(m.prerequisites) as string[];
      return prereqs.length === 0 || prereqs.every((p) => completedSlugs.includes(p));
    });
    if (next && state.overdueReviews === 0) {
      recs.push({
        type: "suggestion",
        message: `You are ready to start ${next.name}. This is the natural next step in your learning path.`,
        action: `Start ${next.name}`,
        actionHref: `/modules/${next.slug}`,
      });
    }
  }

  // Quiz accuracy suggestion
  if (state.recentQuizAccuracy > 0 && state.recentQuizAccuracy < 60) {
    recs.push({
      type: "suggestion",
      message: `Your recent quiz accuracy is ${Math.round(state.recentQuizAccuracy)}%. Focus on theory review and concept checks before doing more coding practice.`,
      action: "Quiz Center",
      actionHref: "/quiz",
    });
  } else if (state.recentQuizAccuracy >= 80) {
    recs.push({
      type: "encouragement",
      message: `Great quiz performance at ${Math.round(state.recentQuizAccuracy)}%! You are building strong theoretical foundations. Consider practicing medium-level problems.`,
    });
  }

  // Default encouragement if nothing else
  if (recs.length === 0) {
    recs.push({
      type: "encouragement",
      message: `You are making great progress! Keep up your daily practice and review discipline. Consistency is the key to interview readiness.`,
    });
  }

  return recs.slice(0, 4);
}

export function computeModuleMastery(progress: {
  quizScore: number;
  practiceScore: number;
  confidenceAverage: number;
  explanationScore: number;
  hintDependencyScore: number;
}): number {
  const quizWeight = 0.25;
  const practiceWeight = 0.3;
  const confidenceWeight = 0.2;
  const explanationWeight = 0.15;
  const hintPenalty = 0.1;

  const hintScore = Math.max(0, 100 - progress.hintDependencyScore);

  return (
    progress.quizScore * quizWeight +
    progress.practiceScore * practiceWeight +
    progress.confidenceAverage * confidenceWeight +
    progress.explanationScore * explanationWeight +
    hintScore * hintPenalty
  );
}

export function getModuleReadiness(progress: {
  quizScore: number;
  practiceScore: number;
  confidenceAverage: number;
  explanationScore: number;
  hintDependencyScore: number;
  masteryScore: number;
}): { ready: boolean; label: string; color: string } {
  if (progress.masteryScore >= 80 && progress.hintDependencyScore < 30) {
    return { ready: true, label: "Interview Ready", color: "green" };
  }
  if (progress.masteryScore >= 60) {
    return { ready: false, label: "Needs Practice", color: "yellow" };
  }
  if (progress.masteryScore >= 30) {
    return { ready: false, label: "Learning", color: "blue" };
  }
  return { ready: false, label: "Just Started", color: "gray" };
}

export function getReviewSchedule(
  confidenceScore: number,
  wasCorrect: boolean
): Date {
  const now = new Date();
  let daysUntilReview: number;

  if (!wasCorrect || confidenceScore < 30) {
    daysUntilReview = 1;
  } else if (confidenceScore < 50) {
    daysUntilReview = 2;
  } else if (confidenceScore < 70) {
    daysUntilReview = 4;
  } else if (confidenceScore < 85) {
    daysUntilReview = 7;
  } else {
    daysUntilReview = 14;
  }

  now.setDate(now.getDate() + daysUntilReview);
  return now;
}

export function computeInterviewReadiness(modules: ModuleWithProgress[]): number {
  const started = modules.filter((m) => m.moduleProgress?.masteryScore != null && m.moduleProgress.masteryScore > 0);
  if (started.length === 0) return 0;

  const avgMastery =
    started.reduce((sum, m) => sum + (m.moduleProgress?.masteryScore ?? 0), 0) /
    started.length;

  const coverage = (started.length / modules.length) * 100;
  return Math.round(avgMastery * 0.7 + coverage * 0.3);
}
