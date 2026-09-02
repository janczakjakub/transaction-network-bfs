import { analyzeAccount } from "./analysis/analyzeAccount.js";
import { calculateRiskScore } from "./risk/calculateRiskScore.js";
import { generateTransactionNetwork } from "./generators/generateTransactionNetwork.js";
import { MAX_ACCOUNTS, MAX_TRANSACTIONS } from "./generators/limits.js";
import { assertCount } from "./validation/assertions.js";

const MAX_CLI_DEPTH = 20;

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Zmienne środowiskowe pochodzą spoza aplikacji, więc muszą przejść walidację zakresu -
 * bez niej `ACCOUNTS=1e12` próbowałoby zaalokować tablicę i wywrócić proces.
 */
function readEnvCount(name, defaultValue, max) {
  return assertCount(process.env[name] ?? defaultValue, {
    fieldName: name,
    min: 0,
    max
  });
}

function printReasons(reasons) {
  if (reasons.length === 0) {
    console.log("No rules triggered.");
    return;
  }

  for (const item of reasons) {
    console.log(`+${item.points}  ${item.reason}`);
  }
}

function printPath(path) {
  if (!path || path.length === 0) {
    console.log("No flagged connection found in selected depth.");
    return;
  }

  for (let index = 0; index < path.length; index += 1) {
    console.log(path[index]);
    if (index < path.length - 1) {
      console.log("  ->");
    }
  }
}

function readConfig() {
  return {
    accountCount: readEnvCount("ACCOUNTS", 10_000, MAX_ACCOUNTS),
    transactionCount: readEnvCount("TRANSACTIONS", 100_000, MAX_TRANSACTIONS),
    maxDepth: readEnvCount("MAX_DEPTH", 3, MAX_CLI_DEPTH),
    seed: process.env.SEED
  };
}

function run() {
  const config = readConfig();

  const network = generateTransactionNetwork({
    accounts: config.accountCount,
    transactions: config.transactionCount,
    seed: config.seed,
    suspiciousPatterns: {
      rapidTransfers: 20,
      fanOut: 10,
      fanIn: 10,
      flaggedConnections: 20
    }
  });

  const targetAccount =
    network.metadata.flaggedConnections[0]?.source ?? network.accounts[0]?.id;

  if (!targetAccount) {
    console.log("Generated network is empty - nothing to analyze.");
    return;
  }

  const analysis = analyzeAccount(network.graph, targetAccount, {
    maxDepth: config.maxDepth
  });
  const risk = calculateRiskScore(analysis);
  const bfsStats = analysis.bfs.shared;

  console.log("Transaction Network BFS");
  console.log("");
  console.log("Network:");
  console.log(`Accounts:      ${formatNumber(network.accounts.length)}`);
  console.log(`Transactions:  ${formatNumber(network.transactions.length)}`);
  console.log("");
  console.log("Analyzing:");
  console.log(targetAccount);
  console.log("");
  console.log(`Risk score: ${risk.riskScore} / 100`);
  console.log(`Risk level: ${risk.riskLevel}`);
  console.log("");
  console.log("Reasons:");
  printReasons(risk.reasons);
  console.log("");
  console.log("Closest flagged path:");
  printPath(analysis.closestFlaggedAccount?.path ?? []);
  console.log("");
  console.log("BFS statistics:");
  console.log(`depth reached:          ${bfsStats.maxDepthReached}`);
  console.log(`accounts visited:       ${formatNumber(bfsStats.visitedAccounts)}`);
  console.log(`transactions checked:   ${formatNumber(bfsStats.transactionsChecked)}`);
  console.log(`max queue size:         ${formatNumber(bfsStats.maxQueueSize)}`);
  console.log(`execution time:         ${bfsStats.executionTimeMs} ms`);
}

try {
  run();
} catch (error) {
  console.error(`Failed to run analysis: ${error.message}`);
  process.exitCode = 1;
}
