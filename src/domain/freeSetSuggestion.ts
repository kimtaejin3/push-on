export const suggestFreeSets = (
  bestReps: number | null,
): {sets: number; reps: number; restSeconds: number} | null =>
  bestReps === null
    ? null
    : {sets: 3, reps: Math.max(1, Math.round(bestReps * 0.6)), restSeconds: 60};
