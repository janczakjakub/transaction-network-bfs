import { getRiskLevel } from "./getRiskLevel.js";

function addReason(reasons, points, reason) {
  if (points <= 0) {
    return 0;
  }

  reasons.push({ points, reason });
  return points;
}

function scoreClosestFlaggedDistance(distance, reasons) {
  if (distance === 1) {
    return addReason(reasons, 40, "flagged account within 1 hop");
  }
  if (distance === 2) {
    return addReason(reasons, 25, "flagged account within 2 hops");
  }
  if (distance === 3) {
    return addReason(reasons, 15, "flagged account within 3 hops");
  }
  return 0;
}

export function calculateRiskScore(analysis, options = {}) {
  const suspiciousNearbyCap = options.suspiciousNearbyCap ?? 20;
  const suspiciousNearbyMultiplier = options.suspiciousNearbyMultiplier ?? 5;
  const rapidForwardingCap = options.rapidForwardingCap ?? 20;
  const rapidForwardingMultiplier = options.rapidForwardingMultiplier ?? 10;
  const fanOutPoints = options.fanOutPoints ?? 10;
  const fanInPoints = options.fanInPoints ?? 10;
  const burstPoints = options.burstPoints ?? 3;

  const reasons = [];
  let score = 0;

  score += scoreClosestFlaggedDistance(
    analysis.closestFlaggedAccount?.distance ?? null,
    reasons
  );

  const suspiciousNearbyPoints = Math.min(
    (analysis.flaggedAccountsNearby ?? 0) * suspiciousNearbyMultiplier,
    suspiciousNearbyCap
  );
  score += addReason(
    reasons,
    suspiciousNearbyPoints,
    `${analysis.flaggedAccountsNearby ?? 0} suspicious accounts nearby`
  );

  const rapidForwardingPoints = Math.min(
    (analysis.rapidForwardingCount ?? 0) * rapidForwardingMultiplier,
    rapidForwardingCap
  );
  score += addReason(
    reasons,
    rapidForwardingPoints,
    "rapid fund forwarding"
  );

  if (analysis.fanOut?.detected) {
    score += addReason(reasons, fanOutPoints, "unusual fan-out");
  }

  if (analysis.fanIn?.detected) {
    score += addReason(reasons, fanInPoints, "unusual fan-in");
  }

  if (analysis.transactionBurst?.detected) {
    score += addReason(reasons, burstPoints, "high transaction volume");
  }

  const normalizedScore = Math.min(Math.max(Math.round(score), 0), 100);

  return {
    score: normalizedScore,
    level: getRiskLevel(normalizedScore),
    reasons
  };
}
