import { Finding } from './types';

const PENALTIES: Record<string, number> = {
  high: 15,
  medium: 7,
  low: 2,
  info: 0,
};

export function computeQualityScore(findings: Finding[]): number {
  const penalty = findings.reduce(
    (total, f) => total + (PENALTIES[f.severity] ?? 0),
    0,
  );
  return Math.max(0, 100 - penalty);
}
