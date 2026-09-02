import { analyzeAccount } from "./analysis/analyzeAccount.js";
import { calculateRiskScore } from "./risk/calculateRiskScore.js";
import { generateTransactionNetwork } from "./generators/generateTransactionNetwork.js";

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
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

function run() {
  const accountCount = Number(process.env.ACCOUNTS ?? 10_000);
  const transactionCount = Number(process.env.TRANSACTIONS ?? 100_000);
  const maxDepth = Number(process.env.MAX_DEPTH ?? 3);

  const network = generateTransactionNetwork({
    accounts: accountCount,
    transactions: transactionCount,
    suspiciousPatterns: {
      rapidTransfers: 20,
      fanOut: 10,
      fanIn: 10,
      flaggedConnections: 20
    }
  });

  const targetAccount =
    network.metadata.flaggedConnections[0]?.source ?? network.accounts[0]?.id;
  const analysis = analyzeAccount(network.graph, targetAccount, { maxDepth });
  const risk = calculateRiskScore(analysis);
  const bfsStats = analysis.bfs.traceFunds;

  console.log("Transaction Network BFS");
  console.log("");
  console.log("Network:");
  console.log(`Accounts:      ${formatNumber(network.accounts.length)}`);
  console.log(`Transactions:  ${formatNumber(network.transactions.length)}`);
  console.log("");
  console.log("Analyzing:");
  console.log(targetAccount);
  console.log("");
  console.log(`Risk score: ${risk.score} / 100`);
  console.log(`Risk level: ${risk.level}`);
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

run();
