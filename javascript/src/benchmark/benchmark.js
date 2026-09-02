import { generateTransactionNetwork } from "../generators/generateTransactionNetwork.js";
import { resolveRandom } from "../utils/random.js";
import { benchmarkBfs } from "./benchmarkBfs.js";

const DEFAULT_SCENARIOS = [
  { accounts: 1_000, transactions: 10_000 },
  { accounts: 10_000, transactions: 100_000 },
  { accounts: 100_000, transactions: 1_000_000 }
];

/**
 * Mierzy wpływ rozmiaru sieci i `maxDepth` na koszt BFS. Sieć dla danego scenariusza
 * jest generowana raz i współdzielona przez wszystkie głębokości.
 */
export function runBenchmarkSuite(options = {}) {
  const scenarios = options.scenarios ?? DEFAULT_SCENARIOS;
  const maxDepths = options.maxDepths ?? [1, 2, 3, 4, 5];
  const sampleSize = options.sampleSize ?? 10;
  const random = resolveRandom(options);

  return scenarios.map((scenario) => {
    const { graph } = generateTransactionNetwork({
      accounts: scenario.accounts,
      transactions: scenario.transactions,
      random,
      startTimestamp: options.startTimestamp
    });

    return {
      scenario,
      byDepth: maxDepths.map((maxDepth) =>
        benchmarkBfs({
          graph,
          accounts: scenario.accounts,
          transactions: scenario.transactions,
          maxDepth,
          sampleSize,
          random
        })
      )
    };
  });
}
