import { benchmarkBfs } from "./benchmarkBfs.js";

const DEFAULT_SCENARIOS = [
  { accounts: 1_000, transactions: 10_000 },
  { accounts: 10_000, transactions: 100_000 },
  { accounts: 100_000, transactions: 1_000_000 }
];

export function runBenchmarkSuite(options = {}) {
  const scenarios = options.scenarios ?? DEFAULT_SCENARIOS;
  const maxDepths = options.maxDepths ?? [1, 2, 3, 4, 5];
  const sampleSize = options.sampleSize ?? 10;

  return scenarios.map((scenario) => ({
    scenario,
    byDepth: maxDepths.map((maxDepth) =>
      benchmarkBfs({
        accounts: scenario.accounts,
        transactions: scenario.transactions,
        maxDepth,
        sampleSize
      })
    )
  }));
}
