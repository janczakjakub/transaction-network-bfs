import test from "node:test";
import assert from "node:assert/strict";

import { detectRapidForwarding } from "../src/detection/detectRapidForwarding.js";
import { detectFanOut } from "../src/detection/detectFanOut.js";
import { detectFanIn } from "../src/detection/detectFanIn.js";
import { detectTransactionBurst } from "../src/detection/detectTransactionBurst.js";
import { calculateRiskScore } from "../src/risk/calculateRiskScore.js";

test("detectRapidForwarding detects near-equal quick forwarding", () => {
  const incoming = [
    { id: "TX-IN", from: "ACC-X", to: "ACC-B", amount: 10_000, timestamp: 0 }
  ];
  const outgoing = [
    {
      id: "TX-OUT",
      from: "ACC-B",
      to: "ACC-Y",
      amount: 9_600,
      timestamp: 5 * 60_000
    }
  ];

  const result = detectRapidForwarding("ACC-B", incoming, outgoing, {
    maxDelayMinutes: 10,
    minForwardRatio: 0.9
  });

  assert.equal(result.detected, true);
  assert.equal(result.count, 1);
});

test("detectFanOut and detectFanIn use threshold rules", () => {
  const fanOut = detectFanOut("ACC-A", 25, { threshold: 20 });
  const fanIn = detectFanIn("ACC-Z", 21, { threshold: 20 });

  assert.equal(fanOut.detected, true);
  assert.equal(fanIn.detected, true);
});

test("detectTransactionBurst finds dense time windows", () => {
  const transactions = [
    { id: "TX-1", timestamp: 0 },
    { id: "TX-2", timestamp: 60_000 },
    { id: "TX-3", timestamp: 120_000 },
    { id: "TX-4", timestamp: 180_000 },
    { id: "TX-5", timestamp: 240_000 }
  ];

  const result = detectTransactionBurst("ACC-B", transactions, {
    maxWindowMinutes: 10,
    minTransactions: 5
  });

  assert.equal(result.detected, true);
  assert.equal(result.peakTransactions, 5);
});

test("calculateRiskScore aggregates points and clamps to 100", () => {
  const result = calculateRiskScore({
    closestFlaggedAccount: { distance: 1 },
    flaggedAccountsNearby: 10,
    rapidForwardingCount: 3,
    fanOut: { detected: true },
    fanIn: { detected: true },
    transactionBurst: { detected: true }
  });

  assert.equal(result.score, 100);
  assert.equal(result.level, "CRITICAL");
  assert.ok(result.reasons.length >= 4);
});
