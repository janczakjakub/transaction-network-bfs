import { bfs } from "./bfs.js";
import { pickBfsStats } from "./bfsStats.js";
import { assertAccountId, assertGraph } from "../validation/assertions.js";

export const DEFAULT_WITHIN_DEPTH = 3;

/**
 * Zbiera konta osiągalne z `accountId` w promieniu `maxDepth`, posortowane rosnąco
 * po odległości. Wynik pochodzi z jednego przebiegu BFS - `O(V_d + E_d)`.
 */
export function collectAccountsWithinDepth(bfsResult, accountId, options = {}) {
  const includeSource = Boolean(options.includeSource);

  return bfsResult.visitOrder.filter((id) => {
    if (!includeSource && id === accountId) {
      return false;
    }
    return true;
  });
}

export function findAccountsWithinDepth(
  graph,
  accountId,
  maxDepth = DEFAULT_WITHIN_DEPTH,
  options = {}
) {
  assertGraph(graph);
  assertAccountId(accountId);

  const result = bfs(graph, accountId, { maxDepth });
  const accounts = collectAccountsWithinDepth(result, accountId, options);

  return {
    accountId,
    maxDepth,
    accounts,
    depthByAccount: result.depthByAccount,
    bfs: pickBfsStats(result)
  };
}
