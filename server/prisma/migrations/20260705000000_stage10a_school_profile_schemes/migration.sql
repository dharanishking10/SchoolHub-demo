-- Stage 10A: Extend SchoolProfile + Add GovernmentScheme

-- Add new columns to SchoolProfile
ALTER TABLE "SchoolProfile" ADD COLUMN IF NOT EXISTS "emisCode"      TEXT NOT NULL DEFAULT '';
ALTER TABLE "SchoolProfile" ADD COLUMN IF NOT EXISTS "udiseCode"     TEXT NOT NULL DEFAULT '';
ALTER TABLE "SchoolProfile" ADD COLUMN IF NOT EXISTS "address"       TEXT NOT NULL DEFAULT '';
ALTER TABLE "SchoolProfile" ADD COLUMN IF NOT EXISTS "panchayat"     TEXT NOT NULL DEFAULT '';
ALTER TABLE "SchoolProfile" ADD COLUMN IF NOT EXISTS "pinCode"       TEXT NOT NULL DEFAULT '';
ALTER TABLE "SchoolProfile" ADD COLUMN IF NOT EXISTS "contactNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "SchoolProfile" ADD COLUMN IF NOT EXISTS "email"         TEXT NOT NULL DEFAULT '';
ALTER TABLE "SchoolProfile" ADD COLUMN IF NOT EXISTS "logoUrl"       TEXT NOT NULL DEFAULT '';

-- Create GovernmentScheme table
CREATE TABLE IF NOT EXISTS "GovernmentScheme" (
    "id"               SERIAL       PRIMARY KEY,
    "studentId"        INTEGER      NOT NULL,
    "className"        TEXT         NOT NULL,
    "section"          TEXT         NOT NULL,
    "academicYear"     TEXT         NOT NULL,
    "schemeName"       TEXT         NOT NULL,
    "distributionDate" TEXT         NOT NULL DEFAULT '',
    "status"           TEXT         NOT NULL DEFAULT 'PENDING',
    "remarks"          TEXT         NOT NULL DEFAULT '',
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GovernmentScheme_studentId_fkey"
        FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE
);
