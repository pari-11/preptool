-- AlterTable
ALTER TABLE "ProblemCompany" ADD COLUMN     "frequency" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "ProblemCompany_company_id_idx" ON "ProblemCompany"("company_id");
