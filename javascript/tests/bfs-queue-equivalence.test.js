import test from "node:test";
import assert from "node:assert/strict";

import { bfs } from "../src/algorithms/bfs.js";
import { bfsWithShift } from "../src/algorithms/bfsWithShift.js";
import { generateTransactionNetwork } from "../src/generators/generateTransactionNetwork.js";
import { TransactionGraph } from "../src/graph/TransactionGraph.js";

function pickComparableResult(result) {
  return {
    found: result.found,
    foundAccount: result.foundAccount,
    path: result.path,
    pathLength: result.pathLength,
    visitedAccounts: result.visitedAccounts,
    transactionsChecked: result.transactionsChecked,
    maxQueueSize: result.maxQueueSize,
    maxDepthReached: result.maxDepthReached,
    truncated: result.truncated,
    reachedAccounts: result.reachedAccounts,
    depthByAccount: result.depthByAccount,
    visitOrder: result.visitOrder,
    sourceAccount: result.sourceAccount,
    parentByAccount: [...result.parentByAccount.entries()]
  };
}

function assertQueueStrategiesEquivalent(graph, sourceAccount, options) {
  const fromHead = bfs(graph, sourceAccount, options);
  const fromShift = bfsWithShift(graph, sourceAccount, options);

  assert.deepEqual(pickComparableResult(fromHead), pickComparableResult(fromShift));
}

test("bfs and bfsWithShift return the same result on a hand-crafted graph", () => {
  const graph = new TransactionGraph();
  graph.addTransactions([
    { id: "TX-1", from: "ACC-A", to: "ACC-B", amount: 100, timestamp: 1 },
    { id: "TX-2", from: "ACC-B", to: "ACC-C", amount: 100, timestamp: 2 },
    { id: "TX-3", from: "ACC-C", to: "ACC-D", amount: 100, timestamp: 3 },
    { id: "TX-4", from: "ACC-A", to: "ACC-E", amount: 100, timestamp: 4 },
    { id: "TX-5", from: "ACC-E", to: "ACC-D", amount: 100, timestamp: 5 },
    { id: "TX-6", from: "ACC-C", to: "ACC-A", amount: 100, timestamp: 6 }
  ]);

  assertQueueStrategiesEquivalent(graph, "ACC-A", {
    direction: "outgoing",
    targetAccount: "ACC-D",
    maxDepth: 4
  });
});

test("bfs and bfsWithShift return the same result on a seeded generated graph", () => {
  const { graph } = generateTransactionNetwork({
    accounts: 120,
    transactions: 450,
    seed: "queue-equivalence",
    startTimestamp: 0
  });

  assertQueueStrategiesEquivalent(graph, "ACC-000001", {
    direction: "outgoing",
    maxDepth: 3
  });
});
