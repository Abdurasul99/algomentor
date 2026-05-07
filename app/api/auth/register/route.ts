import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, password, experienceLevel, goal, leetcodeUsername, targetCompanies } = body;

    // Validate required fields
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    if (!experienceLevel || typeof experienceLevel !== "string") {
      return NextResponse.json({ error: "Experience level is required" }, { status: 400 });
    }
    if (!goal || typeof goal !== "string") {
      return NextResponse.json({ error: "Goal is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Check if email already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Serialize targetCompanies array to JSON string
    const companiesJson = Array.isArray(targetCompanies)
      ? JSON.stringify(targetCompanies)
      : "[]";

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password: hashedPassword,
        experienceLevel,
        goal,
        leetcodeUsername: leetcodeUsername?.trim() ?? "",
        targetCompanies: companiesJson,
      },
    });

    // Initialize ModuleProgress for all modules
    const modules = await prisma.module.findMany({ select: { id: true } });
    if (modules.length > 0) {
      for (const module of modules) {
        await prisma.moduleProgress.upsert({
          where: { userId_moduleId: { userId: user.id, moduleId: module.id } },
          create: { userId: user.id, moduleId: module.id, status: "NotStarted" },
          update: {},
        });
      }
    }

    // Copy curriculum tasks from template (any existing user's tasks serve as master template)
    const templateTasks = await prisma.curriculumTask.findMany({
      orderBy: { orderIndex: "asc" },
      distinct: ["weekId", "orderIndex"],  // one copy per slot
    });

    if (templateTasks.length > 0) {
      await prisma.curriculumTask.createMany({
        data: templateTasks.map((t) => ({
          weekId:            t.weekId,
          userId:            user.id,
          title:             t.title,
          category:          t.category,
          points:            t.points,
          isCompleted:       false,
          leetcodeNumber:    t.leetcodeNumber,
          leetcodeUrl:       t.leetcodeUrl,
          moduleSlug:        t.moduleSlug,
          practiceProblemId: t.practiceProblemId,
          notes:             "",
          orderIndex:        t.orderIndex,
        })),
      });
    }

    return NextResponse.json(
      { success: true, userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[register] error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
