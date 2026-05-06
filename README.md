# Algorithm Mentor Academy

A full beginner-friendly, mentor-style web application for learning algorithms from zero to interview readiness.

## What It Is

Algorithm Mentor Academy is not a tracker or CRUD dashboard. It is a complete interactive algorithm learning system that combines guided learning, theory explanation, interactive hints, quizzes, concept checks, problem tracking, review queues, mistake analysis, progress analytics, and mentor recommendations into a single coherent learning platform.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the database migration
npx prisma migrate dev

# 3. Seed with learning content
npm run db:seed

# 4. Start the dev server
npm run dev
```

Open http://localhost:3000

## Stack

| Layer       | Technology                      |
|-------------|---------------------------------|
| Framework   | Next.js 16 (App Router)         |
| Language    | TypeScript                      |
| Styling     | Tailwind CSS v4                 |
| Database    | SQLite via Prisma 5             |
| Forms       | React Hook Form + Zod           |
| Charts      | Recharts                        |
| Icons       | Lucide React                    |

## Project Structure

```
algo_web/
├── app/
│   ├── page.tsx                      # Dashboard
│   ├── path/page.tsx                 # Learning Path (prerequisite-aware)
│   ├── modules/
│   │   ├── page.tsx                  # All Modules grid
│   │   └── [slug]/page.tsx           # Module Detail — core learning page
│   ├── quiz/
│   │   ├── page.tsx                  # Quiz Center
│   │   └── [moduleSlug]/page.tsx     # Interactive quiz runner
│   ├── practice/
│   │   ├── page.tsx                  # Practice Problems list
│   │   └── [id]/page.tsx             # Mentor-guided practice
│   ├── review/page.tsx               # Spaced repetition review queue
│   ├── analytics/page.tsx            # Learning analytics + charts
│   ├── training/page.tsx             # Personalized daily training plan
│   ├── reflection/page.tsx           # Weekly reflection + mentor summary
│   └── api/
│       ├── quiz/attempt/route.ts     # POST: save quiz answer
│       └── practice/attempt/route.ts # POST: save practice attempt + recalculate scores
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   └── TopBar.tsx                # Page header
│   ├── ui/
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── StatCard.tsx
│   │   └── MentorPanel.tsx           # Mentor recommendation callout panel
│   ├── quiz/
│   │   └── QuizEngine.tsx            # Interactive quiz state machine (client)
│   ├── practice/
│   │   └── PracticeWorkspace.tsx     # Hint ladder + attempt logger (client)
│   └── analytics/
│       └── Charts.tsx                # Recharts charts (client)
├── lib/
│   ├── prisma.ts                     # Prisma client singleton
│   ├── types.ts                      # Shared TypeScript types
│   ├── utils.ts                      # cn, formatDate, color helpers
│   └── mentor.ts                     # All mentor + business logic
├── prisma/
│   ├── schema.prisma                 # Full data model
│   ├── seed.ts                       # Rich seed data (11 modules, quizzes, problems)
│   └── dev.db                        # SQLite database file
└── README.md
```

## Application Pages

| Route                  | Purpose                                                                 |
|------------------------|-------------------------------------------------------------------------|
| `/`                    | Dashboard: streak, stats, mentor panel, module progress overview        |
| `/path`                | Structured curriculum with prerequisite locking and readiness badges    |
| `/modules`             | Grid of all 11 algorithm modules                                        |
| `/modules/[slug]`      | Core learning: theory, concept checks, hint-based practice, mastery     |
| `/quiz`                | Quiz Center: per-module and mixed-mode quizzes with accuracy tracking   |
| `/quiz/[moduleSlug]`   | Interactive quiz with instant feedback and explanation                  |
| `/practice`            | Filterable problem list with status, confidence, hint level             |
| `/practice/[id]`       | Mentor-guided practice with progressive 4-level hint ladder             |
| `/review`              | Spaced repetition queue: overdue/due/upcoming module and problem review |
| `/analytics`           | Deep analytics: bar/line/donut charts, mentor diagnosis, weak areas     |
| `/training`            | Ranked daily training plan: what to do now, why, and what to avoid      |
| `/reflection`          | Weekly reflection: mistakes, confidence trend, mentor summary paragraph |

## Where Key Logic Lives

### Mentor Recommendations — `lib/mentor.ts`
`generateMentorRecommendations()` produces up to 4 contextual recommendations based on:
overdue reviews → weakest module → hint dependency → low confidence → next module to start → quiz accuracy

### Hint System — `components/practice/PracticeWorkspace.tsx`
Progressive 4-level hint ladder stored per problem in `PracticeProblem`:
- Hint 1: gentle direction
- Hint 2: stronger clue  
- Hint 3: structural guidance
- Hint 4: near-pseudocode
- Final explanation: only revealed on explicit request

Hint level used is saved to `ProblemAttempt.hintUsedLevel` and factors into `hintDependencyScore`.

### Quiz Engine — `components/quiz/QuizEngine.tsx`
State machine: `idle → question → feedback → next → complete`
Handles: MultipleChoice, TrueFalse, FillInTheGap, ConceptCheck.
Submits to `/api/quiz/attempt` which recalculates `ModuleProgress.quizScore`.

### Module Mastery Formula — `lib/mentor.ts`
```
mastery = quizScore     × 0.25
        + practiceScore × 0.30
        + confidence    × 0.20
        + explanation   × 0.15
        + (100−hints)   × 0.10
```
Interview-ready threshold: mastery ≥ 80 AND hintDependency < 30.

### Spaced Repetition — `lib/mentor.ts`
`getReviewSchedule()` sets revisit date based on confidence:
- < 30 or wrong → 1 day
- < 50 → 2 days
- < 70 → 4 days
- < 85 → 7 days
- ≥ 85 → 14 days

### Training Plan Logic — `app/training/page.tsx`
Generates ranked tasks by checking (in priority order):
1. Overdue reviews → Critical
2. Theory not completed → High
3. Quiz score < 50 → do quizzes first
4. Hint dependency > 60 → revisit concept checks
5. Practice score < 50 → more guided problems
6. All scores > 70 → ready for medium problems
7. Prerequisites met → suggest next module

## Seeded Content

| Content Type        | Count / Detail                                                    |
|---------------------|-------------------------------------------------------------------|
| Modules             | 11 (Arrays→DP, fully described with theory + mistakes)            |
| Quiz Questions      | 20+ across 6 modules (MC, TrueFalse, FillInGap, ConceptCheck)     |
| Practice Problems   | 12 across 5 modules with full 4-level hint ladders                |
| Module Progress     | 3 modules with realistic in-progress data                         |
| Daily Activity      | 7 days of activity history                                        |
| Problem Attempts    | Sample attempts with review logs                                  |

## npm Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run db:seed      # Seed database with learning content
npm run db:migrate   # Run pending Prisma migrations
npm run db:reset     # Reset DB and re-seed from scratch
```

## Extending the Platform

**Add a new module:** Add entry to `prisma/seed.ts` modules array with theory content, quiz questions, and practice problems. Run `npm run db:seed`.

**Add new quiz questions:** Add to `quizData` in `prisma/seed.ts`. Supports MultipleChoice, TrueFalse, FillInTheGap, ConceptCheck.

**Add authentication:** Add a `User` model, add `userId` FKs to `ModuleProgress` / `ProblemAttempt` / `QuizAttempt`, use NextAuth or Clerk.

**Add an admin editor:** Create pages under `/admin` using Prisma CRUD. All models support rich content management.
