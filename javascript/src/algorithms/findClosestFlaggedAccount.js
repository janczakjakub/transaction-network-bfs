import { bfs, buildPathTo } from "./bfs.js";
import { pickBfsStats } from "./bfsStats.js";
import { createFlagCheck } from "../graph/flags.js";
import { assertAccountId, assertGraph } from "../validation/assertions.js";

export const DEFAULT_FLAGGED_MAX_DEPTH = 3;

/**
 * Wyszukuje najbliższe oznaczone konto w gotowym wyniku BFS. `visitOrder` jest
 * uporządkowany rosnąco po głębokości, więc pierwsze trafienie jest najbliższe.
 */
export function findFlaggedInBfsResult(bfsResult, isFlagged, options = {}) {
  const includeSource = Boolean(options.includeSource);

  for (const candidateAccountId of bfsResult.visitOrder) {
    if (!includeSource && candidateAccountId === bfsResult.sourceAccount) {
      continue;
    }

    if (isFlagged(candidateAccountId)) {
      const path = buildPathTo(bfsResult, candidateAccountId);
      return {
        accountId: candidateAccountId,
        distance: path.length > 0 ? path.length - 1 : null,
        path
      };
    }
  }

  return { accountId: null, distance: null, path: [] };
}

export function findClosestFlaggedAccount(
  graph,
  accountId,
  maxDepth = DEFAULT_FLAGGED_MAX_DEPTH,
  options = {}
) {
  assertGraph(graph);
  assertAccountId(accountId);

  const isFlagged = createFlagCheck(graph, options.flaggedAccounts);
  const includeSource = Boolean(options.includeSource);

  const result = bfs(graph, accountId, {
    maxDepth,
    stopPredicate: (candidateAccountId, depth) => {
      if (!includeSource && depth === 0) {
        return false;
      }
      return isFlagged(candidateAccountId);
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
