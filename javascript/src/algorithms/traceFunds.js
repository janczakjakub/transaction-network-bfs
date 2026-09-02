import { bfs } from "./bfs.js";
import { pickBfsStats } from "./bfsStats.js";
import { assertAccountId, assertGraph } from "../validation/assertions.js";

export const DEFAULT_TRACE_MAX_DEPTH = 3;

export function summarizeTrace(bfsResult, accountId, maxDepth) {
  return {
    accountId,
    maxDepth,
    accountsReached: bfsResult.reachedAccounts.length,
    reachedAccounts: bfsResult.reachedAccounts,
    transactionsTraversed: bfsResult.transactionsChecked,
    maxDepthReached: bfsResult.maxDepthReached,
    bfs: pickBfsStats(bfsResult)
  };
}

export function traceFunds(graph, accountId, options = {}) {
  assertGraph(graph);
  assertAccountId(accountId);

  const maxDepth = options.maxDepth ?? DEFAULT_TRACE_MAX_DEPTH;
  const result = bfs(graph, accountId, { maxDepth });

  return summarizeTrace(result, accountId, maxDepth);
}
