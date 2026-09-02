import { bfs } from "../algorithms/bfs.js";
import { pickBfsStats } from "../algorithms/bfsStats.js";
import { collectAccountsWithinDepth } from "../algorithms/findAccountsWithinDepth.js";
import { findFlaggedInBfsResult } from "../algorithms/findClosestFlaggedAccount.js";
import { summarizeTrace } from "../algorithms/traceFunds.js";
import { createFlagCheck } from "../graph/flags.js";
import { detectFanIn } from "../detection/detectFanIn.js";
import { detectFanOut } from "../detection/detectFanOut.js";
import { detectRapidForwarding } from "../detection/detectRapidForwarding.js";
import { detectTransactionBurst } from "../detection/detectTransactionBurst.js";
import { assertAccountId, assertGraph } from "../validation/assertions.js";

export const DEFAULT_ANALYSIS_MAX_DEPTH = 3;

function countFlagged(accounts, isFlagged) {
  let total = 0;
  for (const accountId of accounts) {
    if (isFlagged(accountId)) {
      total += 1;
    }
  }
  return total;
}

function getUniqueCounter(values) {
  return new Set(values).size;
}

/**
 * Agreguje sygnały ryzyka dla konta. Wszystkie dane grafowe pochodzą z jednego
 * przebiegu BFS - najbliższe oznaczone konto, promień `maxDepth` i śledzenie
 * przepływu środków są wyprowadzane z tego samego wyniku.
 */
export function analyzeAccount(graph, accountId, options = {}) {
  assertGraph(graph);
  assertAccountId(accountId);

  const maxDepth = options.maxDepth ?? DEFAULT_ANALYSIS_MAX_DEPTH;
  const isFlagged = createFlagCheck(graph, options.flaggedAccounts);

  const outgoingTransactions = graph.getOutgoing(accountId);
  const incomingTransactions = graph.getIncoming(accountId);
  const outgoingAccounts = outgoingTransactions.map((transaction) => transaction.to);
  const incomingAccounts = incomingTransactions.map((transaction) => transaction.from);

  const traversal = bfs(graph, accountId, { maxDepth });
  const traversalStats = pickBfsStats(traversal);

  const nearestFlagged = findFlaggedInBfsResult(traversal, isFlagged);
  const accountsWithinDepth = collectAccountsWithinDepth(traversal, accountId);
  const trace = summarizeTrace(traversal, accountId, maxDepth);

  const rapidForwarding = detectRapidForwarding(
    accountId,
    incomingTransactions,
    outgoingTransactions,
    options.rapidForwarding
  );
  const fanOut = detectFanOut(
    accountId,
    getUniqueCounter(outgoingAccounts),
    options.fanOut
  );
  const fanIn = detectFanIn(
    accountId,
    getUniqueCounter(incomingAccounts),
    options.fanIn
  );
  const transactionBurst = detectTransactionBurst(
    accountId,
    [...incomingTransactions, ...outgoingTransactions],
    options.transactionBurst
  );

  const flaggedAccountsNearby = countFlagged(accountsWithinDepth, isFlagged);

  return {
    accountId,
    isFlagged: isFlagged(accountId),
    maxDepth,
    closestFlaggedAccount:
      nearestFlagged.accountId === null
        ? null
        : {
            accountId: nearestFlagged.accountId,
            distance: nearestFlagged.distance,
            path: nearestFlagged.path
          },
    flaggedAccountsNearby,
    rapidForwardingCount: rapidForwarding.count,
    outgoingTransactions: outgoingTransactions.length,
    incomingTransactions: incomingTransactions.length,
    outgoingAccounts: getUniqueCounter(outgoingAccounts),
    incomingAccounts: getUniqueCounter(incomingAccounts),
    accountsReached: trace.accountsReached,
    accountsWithinDepth,
    fanOut,
    fanIn,
    transactionBurst,
    detectors: {
      rapidForwarding,
      fanOut,
      fanIn,
      transactionBurst
    },
    bfs: {
      shared: traversalStats,
      closestFlagged: traversalStats,
      withinDepth: traversalStats,
      traceFunds: traversalStats
    }
  };
}
