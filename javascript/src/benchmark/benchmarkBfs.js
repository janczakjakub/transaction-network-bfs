import { bfs } from "../algorithms/bfs.js";
import { generateTransactionNetwork } from "../generators/generateTransactionNetwork.js";
import { randomInt, resolveRandom } from "../utils/random.js";

function average(values) {
  if (values.length === 0) {
    return 0;
  }

  const sum = values.reduce((acc, value) => acc + value, 0);
  return Number((sum / values.length).toFixed(3));
}

export function benchmarkBfs(options = {}) {
  const accountCount = Number(options.accounts ?? 1_000);
  const transactionCount = Number(options.transactions ?? 10_000);
  const maxDepth = Number(options.maxDepth ?? 3);
  const sampleSize = Number(options.sampleSize ?? 20);
  const random = resolveRandom(options);

  // Graf można podać z zewnątrz, żeby jedna wygenerowana sieć obsłużyła wiele głębokości.
  const graph =
    options.graph ??
    generateTransactionNetwork({
      accounts: accountCount,
      transactions: transactionCount,
      random,
      startTimestamp: options.startTimestamp
    }).graph;
  const accounts = graph.getAccounts();

  const runs = Array.from({ length: sampleSize }, () => {
    const source = accounts[randomInt(random, 0, accounts.length - 1)];
    const result = bfs(graph, source, { maxDepth });
    return {
      visitedAccounts: result.visitedAccounts,
      transactionsChecked: result.transactionsChecked,
      maxQueueSize: result.maxQueueSize,
      maxDepthReached: result.maxDepthReached,
      executionTimeMs: result.executionTimeMs
    };
  });

  return {
    config: {
      accounts: accountCount,
      transactions: transactionCount,
      maxDepth,
      sampleSize
    },
    averages: {
      visitedAccounts: average(runs.map((run) => run.visitedAccounts)),
      transactionsChecked: average(runs.map((run) => run.transactionsChecked)),
      maxQueueSize: average(runs.map((run) => run.maxQueueSize)),
      maxDepthReached: average(runs.map((run) => run.maxDepthReached)),
      executionTimeMs: average(runs.map((run) => run.executionTimeMs))
    },
    runs
  };
}
