export const RISK_THRESHOLDS = {
  CRITICAL: 80,
  HIGH: 60,
  MEDIUM: 30
};

export function getRiskLevel(score) {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    throw new TypeError(`score must be a finite number, received: ${String(score)}`);
  }

  if (score >= RISK_THRESHOLDS.CRITICAL) {
    return "CRITICAL";
  }
  if (score >= RISK_THRESHOLDS.HIGH) {
    return "HIGH";
  }
  if (score >= RISK_THRESHOLDS.MEDIUM) {
    return "MEDIUM";
  }
  return "LOW";
}
