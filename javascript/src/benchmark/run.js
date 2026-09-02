import { runBenchmarkSuite } from "./benchmark.js";

const SMALL_SCENARIOS = [
  { accounts: 1_000, transactions: 10_000 },
  { accounts: 10_000, transactions: 100_000 }
];

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function parseScenarios(raw) {
  if (raw === "full") {
    return undefined;
  }

  if (raw === "small" || raw === undefined) {
    return SMALL_SCENARIOS;
  }

  throw new RangeError(`SCENARIOS must be "small" or "full", received: ${raw}`);
}

function printScenario(entry) {
  console.log(
    `Scenario: ${formatNumber(entry.scenario.accounts)} accounts / ` +
      `${formatNumber(entry.scenario.transactions)} transactions`
  );
  console.log("depth  visited      tx checked   max queue    avg time");

  for (const measurement of entry.byDepth) {
    const { maxDepth } = measurement.config;
    const { visitedAccounts, transactionsChecked, maxQueueSize, executionTimeMs } =
      measurement.averages;

    console.log(
      `${String(maxDepth).padEnd(7)}` +
        `${formatNumber(visitedAccounts).padEnd(13)}` +
        `${formatNumber(transactionsChecked).padEnd(13)}` +
        `${formatNumber(maxQueueSize).padEnd(13)}` +
        `${executionTimeMs} ms`
    );
  }

  console.log("");
}

function run() {
  const scenarios = parseScenarios(process.env.SCENARIOS);
  const seed = process.env.SEED ?? "benchmark";

  console.log("BFS benchmark");
  console.log(`seed: ${seed}`);
  console.log("");

  for (const entry of runBenchmarkSuite({ scenarios, seed, startTimestamp: 0 })) {
    printScenario(entry);
  }
}

try {
  run();
} catch (error) {
  console.error(`Benchmark failed: ${error.message}`);
  process.exitCode = 1;
}
