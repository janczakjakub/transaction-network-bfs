export function pickBfsStats(result) {
  return {
    visitedAccounts: result.visitedAccounts,
    transactionsChecked: result.transactionsChecked,
    maxQueueSize: result.maxQueueSize,
    maxDepthReached: result.maxDepthReached,
    executionTimeMs: result.executionTimeMs,
    truncated: result.truncated
  };
}
