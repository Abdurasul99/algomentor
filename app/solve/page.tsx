import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProblemSolver from "@/components/solve/ProblemSolver";

export const dynamic = "force-dynamic";

export default async function SolvePage() {
  const user = await requireUser();

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { leetcodeUsername: true },
  });

  return (
    // -m-4 lg:-m-6 cancels the shell's padding so we can fill the full viewport height
    <div className="-m-4 lg:-m-6 h-[calc(100vh-56px)] lg:h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <div className="flex-1 overflow-hidden">
          <ProblemSolver
            userName={user.name}
            leetcodeUsername={dbUser?.leetcodeUsername ?? undefined}
          />
        </div>
      </Suspense>
    </div>
  );
}
