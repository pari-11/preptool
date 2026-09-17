import { prisma } from '@/lib/prisma';
import { SolvedCheckbox } from './SolvedCheckbox';

export default async function Home() {
  const stages = await prisma.stage.findMany({
    orderBy: { order: 'asc' },
    include: {
      problems: {
        orderBy: { roadmap_order: 'asc' },
        include: { problem: true },
      },
    },
  });

  const seenProblemIds = new Set<string>();
  let solvedCount = 0;
  for (const stage of stages) {
    for (const placement of stage.problems) {
      if (!seenProblemIds.has(placement.problem.id)) {
        seenProblemIds.add(placement.problem.id);
        if (placement.problem.is_solved) solvedCount++;
      }
    }
  }

  return (
    <main>
      <h1>DSA Roadmap</h1>
      <p className="summary">
        {solvedCount} / {seenProblemIds.size} solved
      </p>

      {stages.map((stage) => (
        <section key={stage.id} className={stage.is_bridge ? 'stage stage-bridge' : 'stage'}>
          <h2>
            <span className="stage-label">{stage.stage_label}</span> — {stage.title}
          </h2>
          {stage.insight_note && <p className="insight">{stage.insight_note}</p>}

          <ul className="problem-list">
            {stage.problems.map((placement) => {
              const problem = placement.problem;
              return (
                <li key={placement.problem_id + placement.stage_id} className="problem-row">
                  <SolvedCheckbox problemId={problem.id} isSolved={problem.is_solved} />

                  {problem.source_link ? (
                    <a href={problem.source_link} target="_blank" rel="noreferrer">
                      {problem.title}
                    </a>
                  ) : (
                    <span>{problem.title}</span>
                  )}

                  {problem.difficulty ? (
                    <span className={`badge difficulty-${problem.difficulty.toLowerCase()}`}>
                      {problem.difficulty}
                    </span>
                  ) : (
                    <span className="badge difficulty-unknown">Unknown</span>
                  )}

                  {placement.tier && <span className={`badge tier-${placement.tier.toLowerCase()}`}>{placement.tier}</span>}

                  {placement.is_priority && <span className="star" title="Priority">★</span>}

                  {problem.is_premium && <span className="lock" title="LeetCode Premium">🔒</span>}

                  {problem.note && <span className="note">{problem.note}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
