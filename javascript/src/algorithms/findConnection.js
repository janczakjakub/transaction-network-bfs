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

export function findConnection(
  graph,
  sourceAccount,
  targetAccount,
  options = {}
) {
  const result = bfs(graph, sourceAccount, {
    targetAccount,
    maxDepth: options.maxDepth
  });

  return {
    connected: result.found,
    hops: result.pathLength,
    path: result.path,
    bfs: pickBfsStats(result)
  };
}
