-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "is_preset" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemTag" (
    "problem_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemTag_pkey" PRIMARY KEY ("problem_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "ProblemTag_tag_id_idx" ON "ProblemTag"("tag_id");

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemTag" ADD CONSTRAINT "ProblemTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data: the pre-added tags. Fixed ids so re-creating the database gives the same rows.
INSERT INTO "Tag" ("id", "name", "color", "is_preset") VALUES
  ('tag_revisit',       'Revisit',       'amber',   true),
  ('tag_tricky',        'Tricky',        'rose',    true),
  ('tag_important',     'Important',     'violet',  true),
  ('tag_silly_mistake', 'Silly mistake', 'sky',     true),
  ('tag_neat_trick',    'Neat trick',    'emerald', true);
