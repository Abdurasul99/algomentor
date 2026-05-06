import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
      profile {
        ranking
        starRating
      }
    }
    userContestRanking(username: $username) {
      rating
      attendedContestsCount
    }
  }
`;

interface AcSubmission {
  difficulty: string;
  count: number;
}

interface LeetCodeApiResponse {
  data?: {
    matchedUser?: {
      submitStats?: {
        acSubmissionNum?: AcSubmission[];
      };
      profile?: {
        ranking?: number;
        starRating?: number;
      };
    } | null;
    userContestRanking?: {
      rating?: number;
      attendedContestsCount?: number;
    } | null;
  };
  errors?: Array<{ message: string }>;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id as string;

    // Determine username: from body or from stored profile
    let username: string | null = null;

    try {
      const body = await req.json();
      if (body?.username && typeof body.username === "string" && body.username.trim()) {
        username = body.username.trim();
      }
    } catch {
      // Body may be empty — fall through to DB lookup
    }

    if (!username) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { leetcodeUsername: true },
      });
      if (user?.leetcodeUsername) {
        username = user.leetcodeUsername.trim();
      }
    }

    if (!username) {
      return NextResponse.json(
        { error: "No LeetCode username found. Please provide one." },
        { status: 400 }
      );
    }

    // Call LeetCode GraphQL API
    let apiData: LeetCodeApiResponse;

    try {
      const response = await fetch(LEETCODE_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://leetcode.com",
          Origin: "https://leetcode.com",
        },
        body: JSON.stringify({ query: PROFILE_QUERY, variables: { username } }),
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            error: `LeetCode API returned ${response.status}. It may be rate-limiting requests.`,
          },
          { status: 502 }
        );
      }

      apiData = await response.json();
    } catch (fetchError: unknown) {
      const msg =
        fetchError instanceof Error && fetchError.name === "TimeoutError"
          ? "LeetCode API timed out. Please try again later."
          : "Failed to reach LeetCode API. It may be temporarily unavailable.";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    if (apiData.errors?.length) {
      return NextResponse.json(
        { error: `LeetCode API error: ${apiData.errors[0].message}` },
        { status: 502 }
      );
    }

    const matchedUser = apiData.data?.matchedUser;

    if (!matchedUser) {
      return NextResponse.json(
        { error: `LeetCode user "${username}" not found.` },
        { status: 404 }
      );
    }

    // Parse submission counts
    const acNums = matchedUser.submitStats?.acSubmissionNum ?? [];
    const getCount = (difficulty: string) =>
      acNums.find((a) => a.difficulty === difficulty)?.count ?? 0;

    const totalSolved = getCount("All");
    const easySolved = getCount("Easy");
    const mediumSolved = getCount("Medium");
    const hardSolved = getCount("Hard");
    const ranking = matchedUser.profile?.ranking ?? 0;
    const contestRating = Math.round(
      apiData.data?.userContestRanking?.rating ?? 0
    );

    // Update leetcodeUsername on user if different
    await prisma.user.update({
      where: { id: userId },
      data: { leetcodeUsername: username },
    });

    // Upsert LeetCodeProfile
    const profile = await prisma.leetCodeProfile.upsert({
      where: { userId },
      create: {
        userId,
        username,
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        ranking,
        contestRating,
        lastSynced: new Date(),
      },
      update: {
        username,
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        ranking,
        contestRating,
        lastSynced: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        username: profile.username,
        totalSolved: profile.totalSolved,
        easySolved: profile.easySolved,
        mediumSolved: profile.mediumSolved,
        hardSolved: profile.hardSolved,
        ranking: profile.ranking,
        contestRating: profile.contestRating,
        lastSynced: profile.lastSynced,
      },
    });
  } catch (error) {
    console.error("[leetcode/sync] error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
