import test from "node:test";
import assert from "node:assert/strict";

import { TransactionGraph } from "../src/graph/TransactionGraph.js";
import { bfs } from "../src/algorithms/bfs.js";
import { findConnection } from "../src/algorithms/findConnection.js";
import { findAccountsWithinDepth } from "../src/algorithms/findAccountsWithinDepth.js";
import { findClosestFlaggedAccount } from "../src/algorithms/findClosestFlaggedAccount.js";

function buildGraph() {
  const graph = new TransactionGraph([
    { id: "ACC-A" },
    { id: "ACC-B" },
    { id: "ACC-C" },
    { id: "ACC-D" },
    { id: "ACC-E", flagged: true },
    { id: "ACC-X" }
  ]);

  graph.addTransactions([
    { id: "TX-1", from: "ACC-A", to: "ACC-B", amount: 100, timestamp: 1 },
    { id: "TX-2", from: "ACC-B", to: "ACC-C", amount: 100, timestamp: 2 },
    { id: "TX-3", from: "ACC-C", to: "ACC-E", amount: 100, timestamp: 3 },
    { id: "TX-4", from: "ACC-A", to: "ACC-D", amount: 100, timestamp: 4 },
    { id: "TX-5", from: "ACC-D", to: "ACC-E", amount: 100, timestamp: 5 },
    { id: "TX-6", from: "ACC-C", to: "ACC-A", amount: 100, timestamp: 6 }
  ]);

  return graph;
}

test("bfs finds shortest path by hop count", () => {
  const graph = buildGraph();
  const result = bfs(graph, "ACC-A", { targetAccount: "ACC-E" });

  assert.equal(result.found, true);
  assert.equal(result.pathLength, 2);
  assert.deepEqual(result.path, ["ACC-A", "ACC-D", "ACC-E"]);
});

test("findConnection returns disconnected when no path exists", () => {
  const graph = buildGraph();
  const result = findConnection(graph, "ACC-X", "ACC-E");

  assert.equal(result.connected, false);
  assert.equal(result.hops, null);
  assert.deepEqual(result.path, []);
});

test("bfs respects maxDepth", () => {
  const graph = buildGraph();
  const result = bfs(graph, "ACC-A", {
    targetAccount: "ACC-E",
    maxDepth: 1
  });

  assert.equal(result.found, false);
  assert.equal(result.maxDepthReached, 1);
});

test("bfs handles cycles with visited set", () => {
  const graph = buildGraph();
  const result = bfs(graph, "ACC-A", { maxDepth: 6 });

  assert.equal(result.found, false);
  assert.equal(result.visitedAccounts, 5);
  assert.ok(result.transactionsChecked >= 5);
});

test("findAccountsWithinDepth returns accounts in radius", () => {
  const graph = buildGraph();
  const result = findAccountsWithinDepth(graph, "ACC-A", 2);

  assert.deepEqual(result.accounts.sort(), ["ACC-B", "ACC-C", "ACC-D", "ACC-E"]);
  assert.equal(result.depthByAccount["ACC-A"], 0);
  assert.equal(result.depthByAccount["ACC-E"], 2);
});

test("findClosestFlaggedAccount finds nearest flagged account", () => {
  const graph = buildGraph();
  const result = findClosestFlaggedAccount(graph, "ACC-A", 4);

  assert.equal(result.accountId, "ACC-E");
  assert.equal(result.distance, 2);
  assert.deepEqual(result.path, ["ACC-A", "ACC-D", "ACC-E"]);
});

test("findConnection honours maxDepth passed through the public API", () => {
  const graph = buildGraph();

  const shallow = findConnection(graph, "ACC-A", "ACC-E", { maxDepth: 1 });
  assert.equal(shallow.connected, false);
  assert.equal(shallow.hops, null);

  const deep = findConnection(graph, "ACC-A", "ACC-E", { maxDepth: 2 });
  assert.equal(deep.connected, true);
  assert.equal(deep.hops, 2);
});

test("findConnection reports a direct neighbour at one hop", () => {
  const graph = buildGraph();
  const result = findConnection(graph, "ACC-A", "ACC-B", { maxDepth: 1 });

  assert.equal(result.connected, true);
  assert.equal(result.hops, 1);
  assert.deepEqual(result.path, ["ACC-A", "ACC-B"]);
});
