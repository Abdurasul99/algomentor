import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const query = `query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    timestamp
  }
}`;

interface LeetCodeSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
}

interface LeetCodeApiResponse {
  data?: {
    recentAcSubmissionList?: LeetCodeSubmission[];
  };
  errors?: Array<{ message: string }>;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Get the user's LeetCode username from profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { leetcodeUsername: true },
    });

    const username = user?.leetcodeUsername?.trim();

    if (!username) {
      return NextResponse.json(
        { error: "No LeetCode username configured", noUsername: true },
        { status: 200 }
      );
    }

    // Fetch recent accepted submissions from LeetCode GraphQL
    let apiData: LeetCodeApiResponse;

    try {
      const response = await fetch(LEETCODE_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Referer: "https://leetcode.com",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Origin: "https://leetcode.com",
        },
        body: JSON.stringify({
          query,
          variables: { username, limit: 15 },
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            error: `LeetCode API returned ${response.status}. It may be rate-limiting requests.`,
            rateLimited: true,
          },
          { status: 200 }
        );
      }

      apiData = (await response.json()) as LeetCodeApiResponse;
    } catch (fetchError: unknown) {
      const isTimeout =
        fetchError instanceof Error && fetchError.name === "TimeoutError";
      return NextResponse.json(
        {
          error: isTimeout
            ? "LeetCode API timed out."
            : "Failed to reach LeetCode API.",
          rateLimited: true,
        },
        { status: 200 }
      );
    }

    if (apiData.errors?.length) {
      return NextResponse.json(
        { error: `LeetCode error: ${apiData.errors[0].message}` },
        { status: 200 }
      );
    }

    const submissions = apiData.data?.recentAcSubmissionList ?? [];

    const result = submissions.map((sub) => ({
      id: sub.id,
      title: sub.title,
      titleSlug: sub.titleSlug,
      timestamp: sub.timestamp,
      leetcodeUrl: `https://leetcode.com/problems/${sub.titleSlug}/`,
    }));

    return NextResponse.json({ submissions: result, username });
  } catch (error) {
    console.error("[leetcode/history] error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
