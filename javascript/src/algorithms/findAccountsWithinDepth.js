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

export function findAccountsWithinDepth(
  graph,
  accountId,
  maxDepth,
  options = {}
) {
  const includeSource = Boolean(options.includeSource);
  const result = bfs(graph, accountId, { maxDepth });
  const accounts = Object.entries(result.depthByAccount)
    .filter(([id, depth]) => {
      if (depth > maxDepth) {
        return false;
      }
      if (!includeSource && id === accountId) {
        return false;
      }
      return true;
    })
    .sort((left, right) => left[1] - right[1])
    .map(([id]) => id);

  return {
    accountId,
    maxDepth,
    accounts,
    depthByAccount: result.depthByAccount,
    bfs: pickBfsStats(result)
  };
}
