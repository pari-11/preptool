import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BulkSolvedForm } from './BulkSolvedForm';

export default function BulkSolvedPage() {
  return (
    <div>
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-8">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Roadmap
        </Link>
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Bulk mark solved</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Paste LeetCode problem numbers separated by commas, spaces or new lines. They are recorded as
            solved with an unknown date and no rating; you can rate them later. Problems already marked
            solved are skipped, so running the same list twice is safe.
          </p>
        </header>
        <BulkSolvedForm />
      </div>
    </div>
  );
}
