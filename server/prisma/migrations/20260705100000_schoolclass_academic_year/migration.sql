-- Add academicYear column to SchoolClass and update unique constraint
ALTER TABLE "SchoolClass" ADD COLUMN IF NOT EXISTS "academicYear" TEXT NOT NULL DEFAULT '2025-2026';
ALTER TABLE "SchoolClass" ADD COLUMN IF NOT EXISTS "classTeacherId" INTEGER;
ALTER TABLE "SchoolClass" ADD COLUMN IF NOT EXISTS "roomNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SchoolClass" ADD COLUMN IF NOT EXISTS "maxStrength" INTEGER NOT NULL DEFAULT 40;
ALTER TABLE "SchoolClass" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- Drop old unique index and create new composite one
DROP INDEX IF EXISTS "SchoolClass_name_section_key";
CREATE UNIQUE INDEX IF NOT EXISTS "SchoolClass_name_section_academicYear_key" ON "SchoolClass"("name", "section", "academicYear");

-- Add foreign key for classTeacherId if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'SchoolClass_classTeacherId_fkey'
  ) THEN
    ALTER TABLE "SchoolClass"
      ADD CONSTRAINT "SchoolClass_classTeacherId_fkey"
      FOREIGN KEY ("classTeacherId") REFERENCES "Teacher"("id") ON DELETE SET NULL;
  END IF;
END
$$;
