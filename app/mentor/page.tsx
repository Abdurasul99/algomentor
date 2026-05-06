export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MentorChat from "@/components/mentor/MentorChat";

export default async function MentorPage() {
  const user = await requireUser();

  const [dbUser, leetcodeProfile, moduleProgressList, chatHistory] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: user.id } }),
      prisma.leetCodeProfile.findUnique({ where: { userId: user.id } }),
      prisma.moduleProgress.findMany({
        where: { userId: user.id },
        include: { module: true },
      }),
      prisma.aIChatMessage.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        take: 50,
      }),
    ]);

  const weakModules = moduleProgressList
    .filter((mp) => mp.masteryScore < 50 && mp.status !== "NotStarted")
    .map((mp) => mp.module.name);

  const strongModules = moduleProgressList
    .filter((mp) => mp.masteryScore > 70)
    .map((mp) => mp.module.name);

  const userContext = {
    weakModules,
    strongModules,
    totalSolved: leetcodeProfile?.totalSolved ?? 0,
    experienceLevel: dbUser?.experienceLevel ?? "Beginner",
  };

  const initialMessages = chatHistory.map((msg) => ({
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  }));

  return (
    <MentorChat
      initialMessages={initialMessages}
      userName={user.name}
      userContext={userContext}
    />
  );
}
