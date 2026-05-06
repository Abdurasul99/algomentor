-- Drop the old unique index on leetcodeNumber
DROP INDEX IF EXISTS "ProblemVisualCache_leetcodeNumber_key";

-- Add unique index on problemTitle instead
CREATE UNIQUE INDEX IF NOT EXISTS "ProblemVisualCache_problemTitle_key" ON "ProblemVisualCache"("problemTitle");
