import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProblemSolver from "@/components/solve/ProblemSolver";

export const dynamic = "force-dynamic";

export default async function SolvePage() {
  const user = await requireUser();

  // Fetch leetcode username from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { leetcodeUsername: true },
  });

  return (
    // Suspense is required because ProblemSolver uses useSearchParams()
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProblemSolver
        userName={user.name}
        leetcodeUsername={dbUser?.leetcodeUsername ?? undefined}
      />
    </Suspense>
  );
}
