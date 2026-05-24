import type { Finding } from "./legacy-types";

const CRITICAL_PENALTY = 10;
const WARNING_PENALTY = 3;
const INFO_PENALTY = 0.5;

// Penalty-based health score. Audit modules only emit problems (never "pass"
// findings), so the score starts at 100 and each finding subtracts a weighted
// penalty, floored at 0.
export function healthScore(findings: Finding[]): number {
  let penalty = 0;
  for (const f of findings) {
    if (f.severity === "critical") penalty += CRITICAL_PENALTY;
    else if (f.severity === "warning") penalty += WARNING_PENALTY;
    else if (f.severity === "info") penalty += INFO_PENALTY;
  }
  return Math.max(0, Math.round(100 - penalty));
}
