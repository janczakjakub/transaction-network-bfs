import { bfs } from "./bfs.js";

function pickBfsStats(result) {
  return {
    visitedAccounts: result.visitedAccounts,
    transactionsChecked: result.transactionsChecked,
    maxQueueSize: result.maxQueueSize,
    maxDepthReached: result.maxDepthReached,
    executionTimeMs: result.executionTimeMs
  };
}

export function traceFunds(graph, accountId, options = {}) {
  const maxDepth = options.maxDepth ?? 3;
  const result = bfs(graph, accountId, { maxDepth });

  return {
    accountId,
    maxDepth,
    accountsReached: result.reachedAccounts.length,
    reachedAccounts: result.reachedAccounts,
    transactionsTraversed: result.transactionsChecked,
    maxDepthReached: result.maxDepthReached,
    bfs: pickBfsStats(result)
  };
}
