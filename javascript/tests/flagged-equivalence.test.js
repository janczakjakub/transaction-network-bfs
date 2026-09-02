import test from "node:test";
import assert from "node:assert/strict";

import { bfs } from "../src/algorithms/bfs.js";
import {
  findClosestFlaggedAccount,
  findFlaggedInBfsResult
} from "../src/algorithms/findClosestFlaggedAccount.js";
import { createFlagCheck } from "../src/graph/flags.js";
import { TransactionGraph } from "../src/graph/TransactionGraph.js";

function compareFlaggedSearch(graph, source, maxDepth, options = {}) {
  const isFlagged = createFlagCheck(graph, options.flaggedAccounts);
  const fromBfs = findFlaggedInBfsResult(
    bfs(graph, source, { maxDepth }),
    isFlagged,
    { includeSource: options.includeSource }
  );
  const fromApi = findClosestFlaggedAccount(graph, source, maxDepth, options);

  assert.deepEqual(
    {
      accountId: fromBfs.accountId,
      distance: fromBfs.distance,
      path: fromBfs.path
    },
    {
      accountId: fromApi.accountId,
      distance: fromApi.distance,
      path: fromApi.path
    }
  );

  return fromBfs;
}

function addEdge(graph, from, to, timestamp) {
  graph.addTransaction({
    id: `TX-${from}-${to}-${timestamp}`,
    from,
    to,
    amount: 100,
    timestamp
  });
}

test("both APIs pick the same flagged account when two are at the same depth", () => {
  const graph = new TransactionGraph([
    { id: "SRC" },
    { id: "MID-L" },
    { id: "MID-R" },
    { id: "FLAG-L", flagged: true },
    { id: "FLAG-R", flagged: true }
  ]);

  addEdge(graph, "SRC", "MID-L", 1);
  addEdge(graph, "SRC", "MID-R", 2);
  addEdge(graph, "MID-L", "FLAG-L", 3);
  addEdge(graph, "MID-R", "FLAG-R", 4);

  const result = compareFlaggedSearch(graph, "SRC", 2);

  assert.equal(result.distance, 2);
  assert.ok(["FLAG-L", "FLAG-R"].includes(result.accountId));
});

test("both APIs prefer the nearer flagged account over a farther one", () => {
  const graph = new TransactionGraph([
    { id: "SRC" },
    { id: "NEAR" },
    { id: "FAR" },
    { id: "FLAG-NEAR", flagged: true },
    { id: "FLAG-FAR", flagged: true }
  ]);

  addEdge(graph, "SRC", "NEAR", 1);
  addEdge(graph, "NEAR", "FLAG-NEAR", 2);
  addEdge(graph, "SRC", "FAR", 3);
  addEdge(graph, "FAR", "FLAG-FAR", 4);

  const result = compareFlaggedSearch(graph, "SRC", 4);

  assert.equal(result.accountId, "FLAG-NEAR");
  assert.equal(result.distance, 2);
  assert.deepEqual(result.path, ["SRC", "NEAR", "FLAG-NEAR"]);
});

test("both APIs return null when no flagged account is within maxDepth", () => {
  const graph = new TransactionGraph([
    { id: "SRC" },
    { id: "MID" },
    { id: "FLAG", flagged: true }
  ]);

  addEdge(graph, "SRC", "MID", 1);
  addEdge(graph, "MID", "FLAG", 2);

  const result = compareFlaggedSearch(graph, "SRC", 1);

  assert.equal(result.accountId, null);
  assert.equal(result.distance, null);
  assert.deepEqual(result.path, []);
});

test("both APIs return null when flagged account is just beyond maxDepth", () => {
  const graph = new TransactionGraph([
    { id: "SRC" },
    { id: "HOP-1" },
    { id: "HOP-2" },
    { id: "FLAG", flagged: true }
  ]);

  addEdge(graph, "SRC", "HOP-1", 1);
  addEdge(graph, "HOP-1", "HOP-2", 2);
  addEdge(graph, "HOP-2", "FLAG", 3);

  const result = compareFlaggedSearch(graph, "SRC", 2);

  assert.equal(result.accountId, null);
  assert.equal(result.distance, null);
  assert.deepEqual(result.path, []);
});

test("both APIs honour includeSource when the source itself is flagged", () => {
  const graph = new TransactionGraph([
    { id: "SRC", flagged: true },
    { id: "OTHER" },
    { id: "FLAG", flagged: true }
  ]);

  addEdge(graph, "SRC", "OTHER", 1);
  addEdge(graph, "OTHER", "FLAG", 2);

  const included = compareFlaggedSearch(graph, "SRC", 2, { includeSource: true });
  assert.equal(included.accountId, "SRC");
  assert.equal(included.distance, 0);
  assert.deepEqual(included.path, ["SRC"]);

  const excluded = compareFlaggedSearch(graph, "SRC", 2, { includeSource: false });
  assert.equal(excluded.accountId, "FLAG");
  assert.equal(excluded.distance, 2);
  assert.deepEqual(excluded.path, ["SRC", "OTHER", "FLAG"]);
});

test("both APIs honour external flaggedAccounts without a graph flag", () => {
  const graph = new TransactionGraph([
    { id: "SRC" },
    { id: "MID" },
    { id: "EXT-FLAG" }
  ]);

  addEdge(graph, "SRC", "MID", 1);
  addEdge(graph, "MID", "EXT-FLAG", 2);

  const result = compareFlaggedSearch(graph, "SRC", 2, {
    flaggedAccounts: ["EXT-FLAG"]
  });

  assert.equal(result.accountId, "EXT-FLAG");
  assert.equal(result.distance, 2);
  assert.deepEqual(result.path, ["SRC", "MID", "EXT-FLAG"]);
});
