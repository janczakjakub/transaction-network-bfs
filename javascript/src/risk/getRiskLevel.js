export function getRiskLevel(score) {
  if (score >= 80) {
    return "CRITICAL";
  }
  if (score >= 60) {
    return "HIGH";
  }
  if (score >= 30) {
    return "MEDIUM";
  }
  return "LOW";
}
