-- CreateTable
CREATE TABLE "Teacher" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "subject" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "rollNumber" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "section" TEXT NOT NULL DEFAULT 'A',
    "gender" TEXT NOT NULL,
    "mobile" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProfile" (
    "id" SERIAL NOT NULL,
    "schoolName" TEXT NOT NULL,
    "schoolCode" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "block" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "headmasterName" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_employeeId_key" ON "Teacher"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_username_key" ON "Teacher"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_key" ON "Student"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolClass_name_section_key" ON "SchoolClass"("name", "section");
