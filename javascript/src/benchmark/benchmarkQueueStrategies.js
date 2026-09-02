import { performance } from "node:perf_hooks";

import { bfs } from "../algorithms/bfs.js";
import { bfsWithShift } from "../algorithms/bfsWithShift.js";
import { generateTransactionNetwork } from "../generators/generateTransactionNetwork.js";
import { randomInt, resolveRandom } from "../utils/random.js";

function toRounded(value) {
  return Number(value.toFixed(3));
}

function measureCall(fn) {
  const startedAt = performance.now();
  fn();
  return performance.now() - startedAt;
}

function calculateStats(values) {
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0
    };
  }

  const sorted = [...values].sort((left, right) => left - right);
  const sum = values.reduce((accumulator, value) => accumulator + value, 0);
  const middle = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle];

  return {
    min: toRounded(sorted[0]),
    max: toRounded(sorted[sorted.length - 1]),
    average: toRounded(sum / values.length),
    median: toRounded(median)
  };
}

function buildBfsOptions(options) {
  const bfsOptions = {
    maxDepth: options.maxDepth
  };

  if (options.direction !== undefined) {
    bfsOptions.direction = options.direction;
  }

  if (options.targetAccount !== undefined) {
    bfsOptions.targetAccount = options.targetAccount;
  }

  if (options.stopPredicate !== undefined) {
    bfsOptions.stopPredicate = options.stopPredicate;
  }

  return bfsOptions;
}

function runImplementation({
  bfsImplementation,
  graph,
  warmupSources,
  measuredSources,
  bfsOptions
}) {
  for (const sourceAccount of warmupSources) {
    bfsImplementation(graph, sourceAccount, bfsOptions);
  }

  const executionTimes = [];
  for (const sourceAccount of measuredSources) {
    executionTimes.push(
      measureCall(() => bfsImplementation(graph, sourceAccount, bfsOptions))
    );
  }

  return {
    executionTimes,
    stats: calculateStats(executionTimes)
  };
}

/**
 * Educational benchmark comparing queue dequeue strategies:
 * - production BFS (`head` index)
 * - benchmark-only BFS using `Array.shift()`
 */
export function benchmarkQueueStrategies(options = {}) {
  const accountCount = Number(options.accounts ?? 10_000);
  const transactionCount = Number(options.transactions ?? 50_000);
  const maxDepth = Number(options.maxDepth ?? 5);
  const warmupRuns = Number(options.warmupRuns ?? 5);
  const measuredRuns = Number(options.measuredRuns ?? 20);
  const random = resolveRandom(options);

  const graph =
    options.graph ??
    generateTransactionNetwork({
      accounts: accountCount,
      transactions: transactionCount,
      random,
      startTimestamp: options.startTimestamp
    }).graph;

  const accounts = graph.getAccounts();
  if (accounts.length === 0) {
    throw new RangeError("Queue benchmark requires a graph with at least one account.");
  }

  const warmupSources = Array.from({ length: warmupRuns }, () =>
    accounts[randomInt(random, 0, accounts.length - 1)]
  );
  const measuredSources = Array.from({ length: measuredRuns }, () =>
    accounts[randomInt(random, 0, accounts.length - 1)]
  );

  const bfsOptions = buildBfsOptions({
    maxDepth,
    direction: options.direction,
    targetAccount: options.targetAccount,
    stopPredicate: options.stopPredicate
  });

  const head = runImplementation({
    bfsImplementation: bfs,
    graph,
    warmupSources,
    measuredSources,
    bfsOptions
  });
  const shift = runImplementation({
    bfsImplementation: bfsWithShift,
    graph,
    warmupSources,
    measuredSources,
    bfsOptions
  });

  const slowdownRatio =
    head.stats.average === 0
      ? null
      : toRounded(shift.stats.average / head.stats.average);

  return {
    config: {
      accounts: accountCount,
      transactions: transactionCount,
      maxDepth,
      direction: options.direction ?? "outgoing",
      warmupRuns,
      measuredRuns
    },
    head,
    shift,
    slowdownRatio
  };
}
