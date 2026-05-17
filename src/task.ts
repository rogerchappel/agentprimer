import type { RepoPrimer, RiskLevel, SuggestedTask } from './types.js';

const riskOrder: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2
};

export function suggestTask(primer: RepoPrimer, maxRisk: RiskLevel = 'low'): SuggestedTask {
  const candidates: SuggestedTask[] = [
    {
      title: 'Add concise agent instructions',
      risk: 'low',
      rationale: 'A top-level AGENTS.md gives future coding agents local rules without touching runtime code.',
      evidence: primer.gaps.filter((gap) => gap.path === 'AGENTS.md')
    },
    {
      title: 'Add a tiny fixture or smoke test',
      risk: 'low',
      rationale: 'A small test fixture improves onboarding confidence while keeping behavior changes contained.',
      evidence: primer.gaps.filter((gap) => gap.path === 'tests/')
    },
    {
      title: 'Document the primary local commands',
      risk: 'low',
      rationale: 'Documenting detected scripts makes the repository easier to hand to another maintainer or agent.',
      evidence: primer.commands.flatMap((command) => command.evidence).slice(0, 3)
    },
    {
      title: 'Review CI workflow names and triggers',
      risk: 'medium',
      rationale: 'CI workflow changes can affect release and verification behavior, so start with a read-only review.',
      evidence: primer.risks.filter((risk) => risk.path === '.github/workflows/')
    }
  ];

  const allowed = candidates.filter((task) => riskOrder[task.risk] <= riskOrder[maxRisk]);
  return allowed.find((task) => task.evidence.length > 0) ?? {
    title: 'Read the README and run the safest detected check',
    risk: 'low',
    rationale: 'No obvious missing docs or tests were found, so start by validating the documented path.',
    evidence: primer.commands.slice(0, 1).flatMap((command) => command.evidence)
  };
}
