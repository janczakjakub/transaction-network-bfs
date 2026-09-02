import { benchmarkQueueStrategies } from "./benchmarkQueueStrategies.js";

const SMALL_SCENARIOS = [
  { label: "Small", accounts: 10_000, transactions: 50_000 },
  { label: "Medium", accounts: 50_000, transactions: 250_000 }
];

const FULL_SCENARIOS = [
  ...SMALL_SCENARIOS,
  { label: "Large (optional)", accounts: 100_000, transactions: 1_000_000 }
];

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatMs(value) {
  return `${Number(value).toFixed(3)} ms`;
}

function parseScenarios(raw) {
  if (raw === undefined || raw === "small") {
    return SMALL_SCENARIOS;
  }

  if (raw === "full") {
    return FULL_SCENARIOS;
  }

  throw new RangeError(`SCENARIOS must be "small" or "full", received: ${raw}`);
}

function printStatsBlock(title, stats) {
  console.log(title);
  console.log(`min:      ${formatMs(stats.min)}`);
  console.log(`median:   ${formatMs(stats.median)}`);
  console.log(`average:  ${formatMs(stats.average)}`);
  console.log(`max:      ${formatMs(stats.max)}`);
  console.log("");
}

function printDifference(slowdownRatio) {
  if (slowdownRatio === null) {
    console.log("Difference:");
    console.log("head average time is 0.000 ms; ratio is not available");
    console.log("");
    return;
  }

  if (slowdownRatio >= 1) {
    console.log("Difference:");
    console.log(`shift is ${slowdownRatio.toFixed(3)}x slower`);
    console.log("");
    return;
  }

  const speedup = (1 / slowdownRatio).toFixed(3);
  console.log("Difference:");
  console.log(`shift is ${speedup}x faster`);
  console.log("");
}

function run() {
  const scenarios = parseScenarios(process.env.SCENARIOS);
  const seed = process.env.SEED ?? "benchmark-queue";
  const maxDepth = Number(process.env.MAX_DEPTH ?? 5);
  const warmupRuns = Number(process.env.WARMUP_RUNS ?? 5);
  const measuredRuns = Number(process.env.MEASURED_RUNS ?? 20);
  const direction = process.env.DIRECTION;

  console.log("Queue Strategy Benchmark");
  console.log(`seed: ${seed}`);
  console.log("");

  for (const scenario of scenarios) {
    const benchmark = benchmarkQueueStrategies({
      accounts: scenario.accounts,
      transactions: scenario.transactions,
      maxDepth,
      direction,
      warmupRuns,
      measuredRuns,
      seed: `${seed}-${scenario.label}`,
      startTimestamp: 0
    });

    console.log(`${scenario.label}`);
    console.log("Graph:");
    console.log(`Accounts:      ${formatNumber(benchmark.config.accounts)}`);
    console.log(`Transactions: ${formatNumber(benchmark.config.transactions)}`);
    console.log(`Direction:     ${benchmark.config.direction}`);
    console.log(`Max depth:     ${benchmark.config.maxDepth}`);
    console.log(`Warm-up runs:  ${formatNumber(benchmark.config.warmupRuns)}`);
    console.log(`Measured runs: ${formatNumber(benchmark.config.measuredRuns)}`);
    console.log("");

    printStatsBlock("HEAD INDEX", benchmark.head.stats);
    printStatsBlock("ARRAY.SHIFT()", benchmark.shift.stats);
    printDifference(benchmark.slowdownRatio);
  }
}

try {
  run();
} catch (error) {
  console.error(`Queue strategy benchmark failed: ${error.message}`);
  process.exitCode = 1;
}
