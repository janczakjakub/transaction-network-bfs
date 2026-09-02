import test from "node:test";
import assert from "node:assert/strict";

import { generateTransactionNetwork } from "../src/generators/generateTransactionNetwork.js";
import { TransactionGraph } from "../src/graph/TransactionGraph.js";
import { analyzeAccount } from "../src/analysis/analyzeAccount.js";

const NETWORK_OPTIONS = {
  accounts: 200,
  transactions: 800,
  seed: "generator-analysis",
  startTimestamp: 0,
  suspiciousPatterns: {
    rapidTransfers: 2,
    fanOut: 1,
    fanIn: 1,
    flaggedConnections: 2
  }
};

test("generateTransactionNetwork creates graph and metadata", () => {
  const result = generateTransactionNetwork(NETWORK_OPTIONS);

  assert.equal(result.accounts.length, 200);
  assert.ok(result.transactions.length >= 800);
  assert.equal(typeof result.graph.getOutgoing, "function");
  assert.equal(result.metadata.rapidTransfers.length, 2);
  assert.equal(result.metadata.flaggedConnections.length, 2);
});

test("analyzeAccount detects the rapid forwarding pattern reported in metadata", () => {
  const network = generateTransactionNetwork(NETWORK_OPTIONS);

  for (const pattern of network.metadata.rapidTransfers) {
    const analysis = analyzeAccount(network.graph, pattern.relay, { maxDepth: 3 });
    assert.ok(
      analysis.rapidForwardingCount >= 1,
      `relay ${pattern.relay} should expose rapid forwarding`
    );
  }
});

test("analyzeAccount finds the flagged account injected behind an intermediary", () => {
  const network = generateTransactionNetwork(NETWORK_OPTIONS);
  const [connection] = network.metadata.flaggedConnections;

  const analysis = analyzeAccount(network.graph, connection.source, { maxDepth: 3 });

  assert.ok(analysis.closestFlaggedAccount !== null);
  assert.ok(analysis.closestFlaggedAccount.distance <= 2);
  assert.equal(analysis.closestFlaggedAccount.path[0], connection.source);
});

test("analyzeAccount aggregates bfs and detector outputs", () => {
  const graph = new TransactionGraph([
    { id: "ACC-A" },
    { id: "ACC-B" },
    { id: "ACC-C", flagged: true },
    { id: "ACC-D" }
  ]);

  graph.addTransactions([
    { id: "TX-1", from: "ACC-A", to: "ACC-B", amount: 10_000, timestamp: 0 },
    {
      id: "TX-2",
      from: "ACC-B",
      to: "ACC-C",
      amount: 9_500,
      timestamp: 3 * 60_000
    },
    { id: "TX-3", from: "ACC-A", to: "ACC-D", amount: 150, timestamp: 10_000 }
  ]);

  const result = analyzeAccount(graph, "ACC-B", { maxDepth: 3 });

  assert.equal(result.accountId, "ACC-B");
  assert.equal(result.closestFlaggedAccount.accountId, "ACC-C");
  assert.equal(result.rapidForwardingCount, 1);
  assert.ok(result.accountsReached >= 1);
});

test("analyzeAccount reports isFlagged=true when the analyzed account is flagged", () => {
  const graph = new TransactionGraph([{ id: "ACC-FLAGGED", flagged: true }]);
  graph.addTransaction({
    id: "TX-1",
    from: "ACC-FLAGGED",
    to: "ACC-OTHER",
    amount: 100,
    timestamp: 1
  });

  const result = analyzeAccount(graph, "ACC-FLAGGED", { maxDepth: 2 });

  assert.equal(result.isFlagged, true);
});

test("analyzeAccount reports isFlagged=false when the analyzed account is not flagged", () => {
  const graph = new TransactionGraph([{ id: "ACC-CLEAN" }, { id: "ACC-OTHER" }]);
  graph.addTransaction({
    id: "TX-1",
    from: "ACC-CLEAN",
    to: "ACC-OTHER",
    amount: 100,
    timestamp: 1
  });

  const result = analyzeAccount(graph, "ACC-CLEAN", { maxDepth: 2 });

  assert.equal(result.isFlagged, false);
});

test("analyzeAccount reuses a single BFS traversal for every graph signal", () => {
  const graph = new TransactionGraph([{ id: "ACC-C", flagged: true }]);
  graph.addTransactions([
    { id: "TX-1", from: "ACC-A", to: "ACC-B", amount: 100, timestamp: 0 },
    { id: "TX-2", from: "ACC-B", to: "ACC-C", amount: 100, timestamp: 1 }
  ]);

  const result = analyzeAccount(graph, "ACC-A", { maxDepth: 3 });

  assert.equal(result.bfs.shared, result.bfs.withinDepth);
  assert.equal(result.bfs.shared, result.bfs.closestFlagged);
  assert.equal(result.bfs.shared, result.bfs.traceFunds);
  assert.deepEqual(result.accountsWithinDepth, ["ACC-B", "ACC-C"]);
  assert.equal(result.flaggedAccountsNearby, 1);
});
