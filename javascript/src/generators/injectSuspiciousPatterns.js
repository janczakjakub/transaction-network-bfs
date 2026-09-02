function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTransactionId(index) {
  return `TX-${String(index).padStart(6, "0")}`;
}

function cloneAccount(account) {
  return {
    id: account.id,
    flagged: Boolean(account.flagged)
  };
}

function pickDistinctAccounts(accounts, size) {
  if (accounts.length < size) {
    return [];
  }

  const picked = new Set();
  while (picked.size < size) {
    picked.add(accounts[randomInt(0, accounts.length - 1)].id);
  }
  return [...picked];
}

function pushTransaction(transactions, nextIdRef, from, to, amount, timestamp) {
  const transaction = {
    id: formatTransactionId(nextIdRef.value),
    from,
    to,
    amount,
    timestamp
  };
  nextIdRef.value += 1;
  transactions.push(transaction);
  return transaction;
}

function injectRapidTransfers(accounts, transactions, metadata, count, nextIdRef, startTimestamp) {
  for (let index = 0; index < count; index += 1) {
    const selected = pickDistinctAccounts(accounts, 3);
    if (selected.length < 3) {
      break;
    }

    const [source, relay, destination] = selected;
    const timestamp = startTimestamp + index * 60_000;
    const amount = randomInt(2_000, 20_000);
    const incoming = pushTransaction(
      transactions,
      nextIdRef,
      source,
      relay,
      amount,
      timestamp
    );
    const outgoing = pushTransaction(
      transactions,
      nextIdRef,
      relay,
      destination,
      Math.round(amount * 0.95),
      timestamp + randomInt(60_000, 9 * 60_000)
    );

    metadata.rapidTransfers.push({
      source,
      relay,
      destination,
      incomingTransactionId: incoming.id,
      outgoingTransactionId: outgoing.id
    });
  }
}

function injectFanOut(accounts, transactions, metadata, count, nextIdRef, startTimestamp) {
  for (let index = 0; index < count; index += 1) {
    const selected = pickDistinctAccounts(accounts, 26);
    if (selected.length < 26) {
      break;
    }

    const [source, ...targets] = selected;
    const timestamp = startTimestamp + index * 120_000;
    const txIds = targets.map((targetId) =>
      pushTransaction(
        transactions,
        nextIdRef,
        source,
        targetId,
        randomInt(100, 2_000),
        timestamp + randomInt(0, 30_000)
      ).id
    );

    metadata.fanOut.push({
      source,
      targetCount: targets.length,
      transactionIds: txIds
    });
  }
}

function injectFanIn(accounts, transactions, metadata, count, nextIdRef, startTimestamp) {
  for (let index = 0; index < count; index += 1) {
    const selected = pickDistinctAccounts(accounts, 26);
    if (selected.length < 26) {
      break;
    }

    const [target, ...sources] = selected;
    const timestamp = startTimestamp + index * 180_000;
    const txIds = sources.map((sourceId) =>
      pushTransaction(
        transactions,
        nextIdRef,
        sourceId,
        target,
        randomInt(100, 2_000),
        timestamp + randomInt(0, 30_000)
      ).id
    );

    metadata.fanIn.push({
      target,
      sourceCount: sources.length,
      transactionIds: txIds
    });
  }
}

function injectFlaggedConnections(accounts, transactions, metadata, count, nextIdRef, startTimestamp) {
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  for (let index = 0; index < count; index += 1) {
    const selected = pickDistinctAccounts(accounts, 3);
    if (selected.length < 3) {
      break;
    }

    const [source, intermediary, flaggedAccountId] = selected;
    accountById.get(flaggedAccountId).flagged = true;
    const timestamp = startTimestamp + index * 240_000;

    const first = pushTransaction(
      transactions,
      nextIdRef,
      source,
      intermediary,
      randomInt(500, 5_000),
      timestamp
    );
    const second = pushTransaction(
      transactions,
      nextIdRef,
      intermediary,
      flaggedAccountId,
      randomInt(500, 5_000),
      timestamp + randomInt(60_000, 5 * 60_000)
    );

    metadata.flaggedConnections.push({
      source,
      intermediary,
      flaggedAccountId,
      transactionIds: [first.id, second.id]
    });
  }
}

export function injectSuspiciousPatterns(
  inputAccounts = [],
  inputTransactions = [],
  suspiciousPatterns = {}
) {
  const accounts = inputAccounts.map(cloneAccount);
  const transactions = [...inputTransactions];
  const metadata = {
    rapidTransfers: [],
    fanOut: [],
    fanIn: [],
    flaggedConnections: []
  };

  const patterns = {
    rapidTransfers: Number(suspiciousPatterns.rapidTransfers ?? 0),
    fanOut: Number(suspiciousPatterns.fanOut ?? 0),
    fanIn: Number(suspiciousPatterns.fanIn ?? 0),
    flaggedConnections: Number(suspiciousPatterns.flaggedConnections ?? 0)
  };

  const nextIdRef = { value: transactions.length + 1 };
  const startTimestamp = Date.now();

  injectRapidTransfers(
    accounts,
    transactions,
    metadata,
    Math.max(0, patterns.rapidTransfers),
    nextIdRef,
    startTimestamp
  );
  injectFanOut(
    accounts,
    transactions,
    metadata,
    Math.max(0, patterns.fanOut),
    nextIdRef,
    startTimestamp + 10_000_000
  );
  injectFanIn(
    accounts,
    transactions,
    metadata,
    Math.max(0, patterns.fanIn),
    nextIdRef,
    startTimestamp + 20_000_000
  );
  injectFlaggedConnections(
    accounts,
    transactions,
    metadata,
    Math.max(0, patterns.flaggedConnections),
    nextIdRef,
    startTimestamp + 30_000_000
  );

  return {
    accounts,
    transactions,
    metadata
  };
}
