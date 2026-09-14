-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('Core', 'Supp', 'Stretch');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('Easy', 'Medium', 'Hard');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('OAReport', 'InterviewExperience', 'Article', 'CoreSubject', 'Aptitude', 'Other');

-- CreateEnum
CREATE TYPE "Credibility" AS ENUM ('High', 'Medium', 'Low');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "is_excluded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stage" (
    "id" TEXT NOT NULL,
    "stage_label" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "insight_note" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "is_bridge" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Stage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "roadmap_order" INTEGER NOT NULL,
    "tier" "Tier" NOT NULL,
    "is_priority" BOOLEAN NOT NULL DEFAULT false,
    "difficulty" "Difficulty" NOT NULL,
    "source_link" TEXT,
    "is_solved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT,
    "type" "ResourceType" NOT NULL,
    "link" TEXT,
    "note" TEXT,
    "credibility" "Credibility" NOT NULL,
    "date_added" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemCompany" (
    "problem_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,

    CONSTRAINT "ProblemCompany_pkey" PRIMARY KEY ("problem_id","company_id")
);

-- CreateTable
CREATE TABLE "ResourceCompany" (
    "resource_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,

    CONSTRAINT "ResourceCompany_pkey" PRIMARY KEY ("resource_id","company_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "Stage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemCompany" ADD CONSTRAINT "ProblemCompany_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemCompany" ADD CONSTRAINT "ProblemCompany_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceCompany" ADD CONSTRAINT "ResourceCompany_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceCompany" ADD CONSTRAINT "ResourceCompany_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
