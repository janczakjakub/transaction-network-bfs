import { TransactionGraph } from "../graph/TransactionGraph.js";
import { resolveRandom } from "../utils/random.js";
import { generateAccounts } from "./generateAccounts.js";
import { generateTransactions } from "./generateTransactions.js";
import { injectSuspiciousPatterns } from "./injectSuspiciousPatterns.js";

const ONE_DAY_MS = 86_400_000;

/**
 * Buduje syntetyczną sieć transakcji. Przekazanie `seed` (lub własnej funkcji `random`)
 * razem z `startTimestamp` czyni wynik w pełni deterministycznym.
 */
export function generateTransactionNetwork(options = {}) {
  const random = resolveRandom(options);
  const startTimestamp = options.startTimestamp ?? Date.now() - ONE_DAY_MS;
  const patternStartTimestamp =
    options.patternStartTimestamp ?? startTimestamp + ONE_DAY_MS;

  const accounts = generateAccounts(options.accounts ?? 0, {
    ...options.accountOptions,
    random
  });
  const transactions = generateTransactions({
    accounts,
    transactions: options.transactions ?? 0,
    startTimestamp,
    maxTimeSpreadMs: options.maxTimeSpreadMs,
    minAmount: options.minAmount,
    maxAmount: options.maxAmount,
    random
  });

  const injected = injectSuspiciousPatterns(
    accounts,
    transactions,
    options.suspiciousPatterns,
    { random, startTimestamp: patternStartTimestamp }
  );

  const graph = new TransactionGraph(injected.accounts);
  graph.addTransactions(injected.transactions);

  return {
    graph,
    accounts: injected.accounts,
    transactions: injected.transactions,
    metadata: injected.metadata
  };
}
