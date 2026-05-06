import { PrismaClient } from "@prisma/client";
import { seedCurriculum } from "./seed-curriculum";

const prisma = new PrismaClient();

async function main() {
  console.log("Running curriculum seed...");

  // Find the demo user
  const user = await prisma.user.findFirst({
    where: { email: "abdurasul@demo.com" },
  });

  if (!user) {
    console.error("Demo user not found. Run the main seed first: npx tsx prisma/seed.ts");
    process.exit(1);
  }

  console.log(`Found demo user: ${user.email} (${user.id})`);
  await seedCurriculum(user.id);
  console.log("Done!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
