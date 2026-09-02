import test from "node:test";
import assert from "node:assert/strict";

import { generateTransactionNetwork } from "../src/generators/generateTransactionNetwork.js";
import { TransactionGraph } from "../src/graph/TransactionGraph.js";
import { analyzeAccount } from "../src/analysis/analyzeAccount.js";

test("generateTransactionNetwork creates graph and metadata", () => {
  const result = generateTransactionNetwork({
    accounts: 200,
    transactions: 800,
    suspiciousPatterns: {
      rapidTransfers: 2,
      fanOut: 1,
      fanIn: 1,
      flaggedConnections: 2
    }
  });

  assert.equal(result.accounts.length, 200);
  assert.ok(result.transactions.length >= 800);
  assert.equal(typeof result.graph.getOutgoing, "function");
  assert.equal(result.metadata.rapidTransfers.length, 2);
  assert.equal(result.metadata.flaggedConnections.length, 2);
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
