import { bfs } from "./bfs.js";
import { pickBfsStats } from "./bfsStats.js";
import { assertAccountId, assertGraph } from "../validation/assertions.js";

export const DEFAULT_CONNECTION_MAX_DEPTH = 6;

export function findConnection(
  graph,
  sourceAccount,
  targetAccount,
  options = {}
) {
  assertGraph(graph);
  assertAccountId(sourceAccount, "sourceAccount");
  assertAccountId(targetAccount, "targetAccount");

  const maxDepth = options.maxDepth ?? DEFAULT_CONNECTION_MAX_DEPTH;
  const result = bfs(graph, sourceAccount, {
    targetAccount,
    maxDepth
  });

  return {
    connected: result.found,
    hops: result.pathLength,
    path: result.path,
    maxDepth,
    bfs: pickBfsStats(result)
  };
}
