import { performance } from "node:perf_hooks";

import { DEFAULT_MAX_DEPTH, DEFAULT_MAX_VISITED } from "./bfs.js";
import {
  assertAccountId,
  assertCount,
  assertGraph,
  resolveMaxDepth
} from "../validation/assertions.js";

const ALLOWED_DIRECTIONS = new Set(["outgoing", "incoming"]);

function normalizeDirection(direction) {
  if (direction === undefined) {
    return "outgoing";
  }

  if (!ALLOWED_DIRECTIONS.has(direction)) {
    throw new Error(
      `Invalid BFS direction "${String(direction)}". Expected "outgoing" or "incoming".`
    );
  }

  return direction;
}

function getNeighborAccountId(transaction, direction) {
  return direction === "incoming" ? transaction.from : transaction.to;
}

function toRoundedMs(startMs) {
  return Number((performance.now() - startMs).toFixed(3));
}

function mapToNullProtoObject(map) {
  const obj = Object.create(null);
  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }
  return obj;
}

function buildPath(parentByAccount, sourceAccount, targetAccount) {
  const path = [];
  let current = targetAccount;

  while (current !== undefined) {
    path.push(current);
    if (current === sourceAccount) {
      break;
    }

    current = parentByAccount.get(current);
  }

  if (path[path.length - 1] !== sourceAccount) {
    return [];
  }

  path.reverse();
  return path;
}

function emptyResult(sourceAccount, startedAt) {
  return {
    found: false,
    foundAccount: null,
    path: [],
    pathLength: null,
    visitedAccounts: 0,
    transactionsChecked: 0,
    maxQueueSize: 0,
    maxDepthReached: 0,
    truncated: false,
    executionTimeMs: toRoundedMs(startedAt),
    reachedAccounts: [],
    depthByAccount: Object.create(null),
    visitOrder: [],
    parentByAccount: new Map(),
    sourceAccount
  };
}

/**
 * Benchmark-only BFS variant that keeps traversal semantics identical to `bfs()`
 * but uses `Array.prototype.shift()` for dequeue operations.
 */
export function bfsWithShift(graph, sourceAccount, options = {}) {
  const startedAt = performance.now();

  assertGraph(graph);
  assertAccountId(sourceAccount, "sourceAccount");

  const maxDepth = resolveMaxDepth(options.maxDepth, DEFAULT_MAX_DEPTH);
  const maxVisited = assertCount(options.maxVisited ?? DEFAULT_MAX_VISITED, {
    fieldName: "maxVisited",
    min: 1
  });
  const direction = normalizeDirection(options.direction);
  const targetAccount = options.targetAccount ?? null;
  const stopPredicate =
    typeof options.stopPredicate === "function" ? options.stopPredicate : null;

  if (!graph.hasAccount(sourceAccount)) {
    return emptyResult(sourceAccount, startedAt);
  }

  const visited = new Set([sourceAccount]);
  const parentByAccount = new Map([[sourceAccount, undefined]]);
  const depthByAccount = new Map([[sourceAccount, 0]]);
  const visitOrder = [sourceAccount];
  const queue = [{ accountId: sourceAccount, depth: 0 }];

  let found = false;
  let foundAccount = null;
  let transactionsChecked = 0;
  let maxQueueSize = queue.length;
  let maxDepthReached = 0;
  let truncated = false;

  while (queue.length > 0) {
    const current = queue.shift();

    if (current.depth > maxDepthReached) {
      maxDepthReached = current.depth;
    }

    const reachedTarget =
      targetAccount !== null && current.accountId === targetAccount;
    const matchedPredicate = stopPredicate
      ? Boolean(stopPredicate(current.accountId, current.depth))
      : false;

    if (reachedTarget || matchedPredicate) {
      found = true;
      foundAccount = current.accountId;
      break;
    }

    if (current.depth >= maxDepth) {
      continue;
    }

    const transactions =
      direction === "incoming"
        ? graph.getIncoming(current.accountId)
        : graph.getOutgoing(current.accountId);

    for (const transaction of transactions) {
      transactionsChecked += 1;
      const neighborAccountId = getNeighborAccountId(transaction, direction);

      if (visited.has(neighborAccountId)) {
        continue;
      }

      if (visited.size >= maxVisited) {
        truncated = true;
        break;
      }

      visited.add(neighborAccountId);
      parentByAccount.set(neighborAccountId, current.accountId);
      depthByAccount.set(neighborAccountId, current.depth + 1);
      visitOrder.push(neighborAccountId);
      queue.push({ accountId: neighborAccountId, depth: current.depth + 1 });

      if (queue.length > maxQueueSize) {
        maxQueueSize = queue.length;
      }
    }

    if (truncated) {
      break;
    }
  }

  const path = found
    ? buildPath(parentByAccount, sourceAccount, foundAccount)
    : [];
  const pathLength = path.length > 0 ? path.length - 1 : null;
  const reachedAccounts = visitOrder.slice(1);

  return {
    found,
    foundAccount,
    path,
    pathLength,
    visitedAccounts: visited.size,
    transactionsChecked,
    maxQueueSize,
    maxDepthReached,
    truncated,
    executionTimeMs: toRoundedMs(startedAt),
    reachedAccounts,
    depthByAccount: mapToNullProtoObject(depthByAccount),
    visitOrder,
    parentByAccount,
    sourceAccount
  };
}
