import test from "node:test";
import assert from "node:assert/strict";

import { TransactionGraph } from "../src/graph/TransactionGraph.js";
import { bfs } from "../src/algorithms/bfs.js";

function buildChain(length) {
  const graph = new TransactionGraph();
  const transactions = [];

  for (let index = 0; index < length - 1; index += 1) {
    transactions.push({
      id: `TX-${index}`,
      from: `ACC-${index}`,
      to: `ACC-${index + 1}`,
      amount: 100,
      timestamp: index
    });
  }

  graph.addTransactions(transactions);
  return graph;
}

function buildDirectionGraph() {
  const graph = new TransactionGraph();
  graph.addTransactions([
    { id: "TX-A-B", from: "ACC-A", to: "ACC-B", amount: 100, timestamp: 1 },
    { id: "TX-B-C", from: "ACC-B", to: "ACC-C", amount: 100, timestamp: 2 }
  ]);
  return graph;
}

test("bfs returns a zero-length path when source equals target", () => {
  const graph = buildChain(3);
  const result = bfs(graph, "ACC-0", { targetAccount: "ACC-0" });

  assert.equal(result.found, true);
  assert.equal(result.pathLength, 0);
  assert.deepEqual(result.path, ["ACC-0"]);
});

test("bfs on an empty graph reports nothing found", () => {
  const graph = new TransactionGraph();
  const result = bfs(graph, "ACC-A");

  assert.equal(result.found, false);
  assert.equal(result.visitedAccounts, 0);
  assert.deepEqual(result.reachedAccounts, []);
});

test("bfs does not mutate the graph for an unknown source account", () => {
  const graph = buildChain(3);
  const accountsBefore = graph.getAccounts();

  const result = bfs(graph, "ACC-UNKNOWN");

  assert.equal(result.found, false);
  assert.equal(result.visitedAccounts, 0);
  assert.equal(graph.hasAccount("ACC-UNKNOWN"), false);
  assert.deepEqual(graph.getAccounts(), accountsBefore);
});

test("bfs with maxDepth 0 visits only the source account", () => {
  const graph = buildChain(4);
  const result = bfs(graph, "ACC-0", { maxDepth: 0 });

  assert.equal(result.visitedAccounts, 1);
  assert.equal(result.transactionsChecked, 0);
  assert.deepEqual(result.reachedAccounts, []);
});

test('bfs supports direction: "outgoing"', () => {
  const graph = buildDirectionGraph();
  const result = bfs(graph, "ACC-A", {
    direction: "outgoing",
    targetAccount: "ACC-C",
    maxDepth: 2
  });

  assert.equal(result.found, true);
  assert.deepEqual(result.path, ["ACC-A", "ACC-B", "ACC-C"]);
});

test('bfs supports direction: "incoming"', () => {
  const graph = buildDirectionGraph();
  const result = bfs(graph, "ACC-C", {
    direction: "incoming",
    targetAccount: "ACC-A",
    maxDepth: 2
  });

  assert.equal(result.found, true);
  assert.deepEqual(result.path, ["ACC-C", "ACC-B", "ACC-A"]);
});

test("bfs uses outgoing direction when direction is not provided", () => {
  const graph = buildDirectionGraph();
  const result = bfs(graph, "ACC-A", {
    targetAccount: "ACC-C",
    maxDepth: 2
  });

  assert.equal(result.found, true);
  assert.deepEqual(result.path, ["ACC-A", "ACC-B", "ACC-C"]);
});

test("bfs rejects an invalid direction value", () => {
  const graph = buildDirectionGraph();

  assert.throws(
    () => bfs(graph, "ACC-A", { direction: "sideways" }),
    /Invalid BFS direction "sideways"\. Expected "outgoing" or "incoming"\./
  );
});

test("bfs rejects direction typos", () => {
  const graph = buildDirectionGraph();

  assert.throws(
    () => bfs(graph, "ACC-A", { direction: "incomming" }),
    /Invalid BFS direction "incomming"\. Expected "outgoing" or "incoming"\./
  );
});

test("bfs counts parallel edges once per transaction but visits the account once", () => {
  const graph = new TransactionGraph();
  graph.addTransactions([
    { id: "TX-1", from: "ACC-A", to: "ACC-B", amount: 100, timestamp: 1 },
    { id: "TX-2", from: "ACC-A", to: "ACC-B", amount: 200, timestamp: 2 },
    { id: "TX-3", from: "ACC-A", to: "ACC-B", amount: 300, timestamp: 3 }
  ]);

  const result = bfs(graph, "ACC-A", { maxDepth: 2 });

  assert.equal(result.visitedAccounts, 2);
  assert.equal(result.transactionsChecked, 3);
  assert.deepEqual(result.reachedAccounts, ["ACC-B"]);
});

test("bfs treats a self-loop as an already visited account", () => {
  const graph = new TransactionGraph();
  graph.addTransaction({
    id: "TX-1",
    from: "ACC-A",
    to: "ACC-A",
    amount: 100,
    timestamp: 1
  });

  const result = bfs(graph, "ACC-A", { maxDepth: 3 });

  assert.equal(result.visitedAccounts, 1);
  assert.deepEqual(result.reachedAccounts, []);
});

test("bfs rejects invalid depth instead of searching the whole graph", () => {
  const graph = buildChain(3);

  assert.throws(() => bfs(graph, "ACC-0", { maxDepth: -1 }), RangeError);
  assert.throws(() => bfs(graph, "ACC-0", { maxDepth: Number.NaN }), TypeError);
});

test("bfs rejects an invalid graph or account id", () => {
  const graph = buildChain(3);

  assert.throws(() => bfs(null, "ACC-0"), TypeError);
  assert.throws(() => bfs(graph, ""), TypeError);
  assert.throws(() => bfs(graph, undefined), TypeError);
});

test("bfs stops and reports truncation once maxVisited is reached", () => {
  const graph = buildChain(10);
  const result = bfs(graph, "ACC-0", { maxDepth: 9, maxVisited: 3 });

  assert.equal(result.truncated, true);
  assert.equal(result.visitedAccounts, 3);
});

test("bfs uses a bounded default depth instead of an unlimited search", () => {
  const graph = buildChain(30);
  const result = bfs(graph, "ACC-0");

  assert.equal(result.truncated, false);
  assert.equal(result.maxDepthReached, 10);
  assert.equal(result.visitedAccounts, 11);
});

test("bfs result map has no prototype so account ids cannot pollute lookups", () => {
  const graph = new TransactionGraph();
  graph.addTransaction({
    id: "TX-1",
    from: "ACC-A",
    to: "__proto__",
    amount: 100,
    timestamp: 1
  });

  const result = bfs(graph, "ACC-A", { maxDepth: 2 });

  assert.equal(Object.getPrototypeOf(result.depthByAccount), null);
  assert.equal(result.depthByAccount["__proto__"], 1);
  assert.equal({}.polluted, undefined);
});
