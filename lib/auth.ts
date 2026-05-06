import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  return session.user as { id: string; email: string; name: string };
}

export async function getOptionalUser() {
  const session = await getServerSession(authOptions);
  return (session?.user ?? null) as { id: string; email: string; name: string } | null;
}
