import type { Finding } from "./legacy-types";

// Health score per the workspace contract (see _finding-schema/SKILL.md §Score
// Formula). Reads severity counts only — info findings are advisory and do not
// participate in scoring. When no relevant findings exist (vacuous case),
// returns 100. Floored at 0, capped at 100, rounded to integer.
export function score(findings: Finding[]): number {
  let pass = 0;
  let critical = 0;
  let warning = 0;
  for (const f of findings) {
    if (f.severity === "pass") pass++;
    else if (f.severity === "critical") critical++;
    else if (f.severity === "warning") warning++;
  }
  const denom = pass + critical * 3 + warning;
  if (denom === 0) return 100;
  return Math.max(0, Math.min(100, Math.round((pass / denom) * 100)));
}

export function categoryScores(findings: Finding[]): Record<string, number> {
  const buckets = new Map<string, Finding[]>();
  for (const f of findings) {
    const arr = buckets.get(f.category);
    if (arr) arr.push(f);
    else buckets.set(f.category, [f]);
  }
  const out: Record<string, number> = {};
  for (const [cat, group] of buckets) out[cat] = score(group);
  return out;
}

// Back-compat alias. New code should call `score()`.
export const healthScore = score;
