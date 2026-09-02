import { findAccountsWithinDepth } from "../algorithms/findAccountsWithinDepth.js";
import { findClosestFlaggedAccount } from "../algorithms/findClosestFlaggedAccount.js";
import { traceFunds } from "../algorithms/traceFunds.js";
import { detectFanIn } from "../detection/detectFanIn.js";
import { detectFanOut } from "../detection/detectFanOut.js";
import { detectRapidForwarding } from "../detection/detectRapidForwarding.js";
import { detectTransactionBurst } from "../detection/detectTransactionBurst.js";

function createFlagCheck(graph, flaggedAccounts) {
  const flaggedSet = flaggedAccounts instanceof Set
    ? flaggedAccounts
    : new Set(flaggedAccounts ?? []);

  return (accountId) => flaggedSet.has(accountId) || graph.isFlagged(accountId);
}

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

export function analyzeAccount(graph, accountId, options = {}) {
  const maxDepth = options.maxDepth ?? 3;
  const isFlagged = createFlagCheck(graph, options.flaggedAccounts);

  const outgoingTransactions = graph.getOutgoing(accountId);
  const incomingTransactions = graph.getIncoming(accountId);
  const outgoingAccounts = outgoingTransactions.map((transaction) => transaction.to);
  const incomingAccounts = incomingTransactions.map((transaction) => transaction.from);

  const nearestFlagged = findClosestFlaggedAccount(graph, accountId, maxDepth, {
    flaggedAccounts: options.flaggedAccounts
  });
  const withinDepth = findAccountsWithinDepth(graph, accountId, maxDepth);
  const trace = traceFunds(graph, accountId, { maxDepth });

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

  const flaggedAccountsNearby = countFlagged(withinDepth.accounts, isFlagged);

  return {
    accountId,
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
      closestFlagged: nearestFlagged.bfs,
      withinDepth: withinDepth.bfs,
      traceFunds: trace.bfs
    }
  };
}
