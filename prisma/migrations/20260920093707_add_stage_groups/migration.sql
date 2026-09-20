-- AlterTable
ALTER TABLE "Stage" ADD COLUMN     "group_id" TEXT;

-- CreateTable
CREATE TABLE "StageGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "StageGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StageGroup_title_key" ON "StageGroup"("title");

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "StageGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data: group the existing sibling stages (Stage 4A + 4B, ...). A group is every stage sharing a
-- number with a letter suffix, needing at least two members. The title is the first sibling's
-- title before " — ". Fresh databases get their groups from prisma/scripts/import-roadmap.ts.
INSERT INTO "StageGroup" ("id", "title")
SELECT DISTINCT ON (s.num) 'sg_' || s.num, trim(split_part(s.title, ' — ', 1))
FROM (
  SELECT title, "order", (regexp_match(stage_label, '^Stage\s+(\d+)[A-Z]$'))[1] AS num FROM "Stage"
) s
WHERE s.num IS NOT NULL
  AND s.num IN (
    SELECT (regexp_match(stage_label, '^Stage\s+(\d+)[A-Z]$'))[1] FROM "Stage"
    GROUP BY 1 HAVING count(*) > 1
  )
ORDER BY s.num, s."order";

UPDATE "Stage"
SET "group_id" = 'sg_' || (regexp_match(stage_label, '^Stage\s+(\d+)[A-Z]$'))[1]
WHERE 'sg_' || (regexp_match(stage_label, '^Stage\s+(\d+)[A-Z]$'))[1] IN (SELECT "id" FROM "StageGroup");
