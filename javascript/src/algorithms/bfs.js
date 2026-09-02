import { performance } from "node:perf_hooks";

function clampDepth(maxDepth) {
  if (maxDepth === undefined || maxDepth === null) {
    return Number.POSITIVE_INFINITY;
  }

  const parsed = Number(maxDepth);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor(parsed);
}

function normalizeDirection(direction) {
  return direction === "incoming" ? "incoming" : "outgoing";
}

function getNeighborAccountId(transaction, direction) {
  return direction === "incoming" ? transaction.from : transaction.to;
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

function toRoundedMs(startMs) {
  return Number((performance.now() - startMs).toFixed(3));
}

function mapToObject(map) {
  const obj = {};
  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }
  return obj;
}

export function bfs(graph, sourceAccount, options = {}) {
  const startedAt = performance.now();
  const maxDepth = clampDepth(options.maxDepth);
  const direction = normalizeDirection(options.direction);
  const targetAccount = options.targetAccount ?? null;
  const stopPredicate =
    typeof options.stopPredicate === "function" ? options.stopPredicate : null;

  if (!sourceAccount || !graph) {
    return {
      found: false,
      foundAccount: null,
      path: [],
      pathLength: null,
      visitedAccounts: 0,
      transactionsChecked: 0,
      maxQueueSize: 0,
      maxDepthReached: 0,
      executionTimeMs: toRoundedMs(startedAt),
      reachedAccounts: [],
      depthByAccount: {}
    };
  }

  graph.addAccount(sourceAccount);

  const visited = new Set([sourceAccount]);
  const parentByAccount = new Map([[sourceAccount, undefined]]);
  const depthByAccount = new Map([[sourceAccount, 0]]);
  const queue = [{ accountId: sourceAccount, depth: 0 }];

  let head = 0;
  let found = false;
  let foundAccount = null;
  let transactionsChecked = 0;
  let maxQueueSize = queue.length;
  let maxDepthReached = 0;

  while (head < queue.length) {
    const current = queue[head];
    head += 1;

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

      visited.add(neighborAccountId);
      parentByAccount.set(neighborAccountId, current.accountId);
      depthByAccount.set(neighborAccountId, current.depth + 1);
      queue.push({ accountId: neighborAccountId, depth: current.depth + 1 });

      if (queue.length - head > maxQueueSize) {
        maxQueueSize = queue.length - head;
      }
    }
  }

  const path = found
    ? buildPath(parentByAccount, sourceAccount, foundAccount)
    : [];
  const pathLength = path.length > 0 ? path.length - 1 : null;
  const reachedAccounts = [...visited].filter(
    (accountId) => accountId !== sourceAccount
  );

  return {
    found,
    foundAccount,
    path,
    pathLength,
    visitedAccounts: visited.size,
    transactionsChecked,
    maxQueueSize,
    maxDepthReached,
    executionTimeMs: toRoundedMs(startedAt),
    reachedAccounts,
    depthByAccount: mapToObject(depthByAccount)
  };
}
