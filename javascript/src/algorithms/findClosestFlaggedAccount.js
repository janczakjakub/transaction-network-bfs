import { bfs } from "./bfs.js";

function toSet(flaggedAccounts) {
  if (flaggedAccounts instanceof Set) {
    return flaggedAccounts;
  }

  return new Set(flaggedAccounts ?? []);
}

function isFlagged(graph, accountId, flaggedSet) {
  if (flaggedSet.has(accountId)) {
    return true;
  }

  return graph.isFlagged(accountId);
}

function pickBfsStats(result) {
  return {
    visitedAccounts: result.visitedAccounts,
    transactionsChecked: result.transactionsChecked,
    maxQueueSize: result.maxQueueSize,
    maxDepthReached: result.maxDepthReached,
    executionTimeMs: result.executionTimeMs
  };
}

export function findClosestFlaggedAccount(
  graph,
  accountId,
  maxDepth,
  options = {}
) {
  const flaggedSet = toSet(options.flaggedAccounts);
  const includeSource = Boolean(options.includeSource);

  const result = bfs(graph, accountId, {
    maxDepth,
    stopPredicate: (candidateAccountId, depth) => {
      if (!includeSource && depth === 0) {
        return false;
      }
      return isFlagged(graph, candidateAccountId, flaggedSet);
    }
  });

  if (!result.found || !result.foundAccount) {
    return {
      accountId: null,
      distance: null,
      path: [],
      bfs: pickBfsStats(result)
    };
  }

  return {
    accountId: result.foundAccount,
    distance: result.pathLength,
    path: result.path,
    bfs: pickBfsStats(result)
  };
}
