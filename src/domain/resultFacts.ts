export type ResultFactsInput = {
  results: number[];
  targets: number[] | null;
  lastIsMax: boolean;
  previousTotal: number | null;
  previousBestSet: number | null;
};

export type ResultFacts = {
  total: number;
  target: number | null;
  diffFromTarget: number | null;
  bestSetIndex: number;
  bestSetReps: number;
  diffFromPrevious: number | null;
  lastSetExtra: number | null;
  isPersonalBestSet: boolean;
};

export const resultFacts = ({
  results,
  targets,
  lastIsMax,
  previousTotal,
  previousBestSet,
}: ResultFactsInput): ResultFacts => {
  const total = results.reduce((sum, reps) => sum + reps, 0);
  const target = targets?.reduce((sum, reps) => sum + reps, 0) ?? null;
  const bestSetReps = results.length ? Math.max(...results) : 0;
  const bestSetIndex = results.indexOf(bestSetReps);
  const lastSetIndex = (targets?.length ?? 0) - 1;
  const lastTarget = targets?.[lastSetIndex];
  const lastResult = results[lastSetIndex];

  return {
    total,
    target,
    diffFromTarget: target === null ? null : total - target,
    bestSetIndex,
    bestSetReps,
    diffFromPrevious: previousTotal === null ? null : total - previousTotal,
    lastSetExtra:
      lastIsMax && lastTarget !== undefined && lastResult !== undefined
        ? lastResult - lastTarget
        : null,
    isPersonalBestSet: previousBestSet !== null && bestSetReps > previousBestSet,
  };
};
