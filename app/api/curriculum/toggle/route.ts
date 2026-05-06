import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as { id: string }).id;

    const body = await req.json();
    const { taskId, isCompleted } = body as { taskId: string; isCompleted: boolean };

    if (!taskId || typeof isCompleted !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: taskId, isCompleted" },
        { status: 400 }
      );
    }

    // Verify the task belongs to this user
    const task = await prisma.curriculumTask.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updated = await prisma.curriculumTask.update({
      where: { id: taskId },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("[POST /api/curriculum/toggle]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
