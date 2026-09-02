import { TransactionGraph } from "../graph/TransactionGraph.js";
import { generateAccounts } from "./generateAccounts.js";
import { generateTransactions } from "./generateTransactions.js";
import { injectSuspiciousPatterns } from "./injectSuspiciousPatterns.js";

export function generateTransactionNetwork(options = {}) {
  const accountCount = Number(options.accounts ?? 0);
  const transactionCount = Number(options.transactions ?? 0);

  const accounts = generateAccounts(accountCount, options.accountOptions);
  const transactions = generateTransactions({
    accounts,
    transactions: transactionCount,
    startTimestamp: options.startTimestamp,
    maxTimeSpreadMs: options.maxTimeSpreadMs,
    minAmount: options.minAmount,
    maxAmount: options.maxAmount
  });

  const injected = injectSuspiciousPatterns(
    accounts,
    transactions,
    options.suspiciousPatterns
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
