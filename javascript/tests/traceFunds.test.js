import test from "node:test";
import assert from "node:assert/strict";

import { TransactionGraph } from "../src/graph/TransactionGraph.js";
import { traceFunds } from "../src/algorithms/traceFunds.js";

function buildGraph() {
  const graph = new TransactionGraph([{ id: "ACC-LEAF" }]);

  graph.addTransactions([
    { id: "TX-1", from: "ACC-A", to: "ACC-B", amount: 100, timestamp: 1 },
    { id: "TX-2", from: "ACC-A", to: "ACC-C", amount: 100, timestamp: 2 },
    { id: "TX-3", from: "ACC-B", to: "ACC-D", amount: 100, timestamp: 3 },
    { id: "TX-4", from: "ACC-D", to: "ACC-E", amount: 100, timestamp: 4 }
  ]);

  return graph;
}

test("traceFunds reports every account reachable within maxDepth", () => {
  const result = traceFunds(buildGraph(), "ACC-A", { maxDepth: 2 });

  assert.equal(result.accountId, "ACC-A");
  assert.equal(result.maxDepth, 2);
  assert.equal(result.accountsReached, 3);
  assert.deepEqual(result.reachedAccounts.sort(), ["ACC-B", "ACC-C", "ACC-D"]);
  assert.equal(result.maxDepthReached, 2);
});

test("traceFunds follows the full chain when depth allows", () => {
  const result = traceFunds(buildGraph(), "ACC-A", { maxDepth: 3 });

  assert.equal(result.accountsReached, 4);
  assert.equal(result.transactionsTraversed, 4);
});

test("traceFunds returns nothing for an account without outgoing transfers", () => {
  const result = traceFunds(buildGraph(), "ACC-LEAF", { maxDepth: 3 });

  assert.equal(result.accountsReached, 0);
  assert.deepEqual(result.reachedAccounts, []);
  assert.equal(result.transactionsTraversed, 0);
});

test("traceFunds with maxDepth 0 does not leave the source account", () => {
  const result = traceFunds(buildGraph(), "ACC-A", { maxDepth: 0 });

  assert.equal(result.accountsReached, 0);
  assert.equal(result.transactionsTraversed, 0);
});

test("traceFunds validates its inputs", () => {
  assert.throws(() => traceFunds(null, "ACC-A"), TypeError);
  assert.throws(() => traceFunds(buildGraph(), ""), TypeError);
});
