import { fromMinorUnits, toMinorUnits } from "../money/money.js";
import { formatTransactionId } from "../utils/ids.js";
import { randomInt, resolveRandom } from "../utils/random.js";
import { assertCount, assertTimestamp } from "../validation/assertions.js";
import { MAX_SUSPICIOUS_PATTERNS } from "./limits.js";

const FAN_PATTERN_SIZE = 26;

function cloneAccount(account) {
  return {
    id: account.id,
    flagged: Boolean(account.flagged)
  };
}

function pickDistinctAccounts(accounts, size, random) {
  if (accounts.length < size) {
    return [];
  }

  const picked = new Set();
  const maxAttempts = size * 10 + accounts.length;

  for (let attempt = 0; attempt < maxAttempts && picked.size < size; attempt += 1) {
    picked.add(accounts[randomInt(random, 0, accounts.length - 1)].id);
  }

  // Deterministyczne domknięcie, gdy losowanie nie zebrało wymaganej liczby kont.
  for (let index = 0; index < accounts.length && picked.size < size; index += 1) {
    picked.add(accounts[index].id);
  }

  return [...picked];
}

function pushTransaction(transactions, nextIdRef, from, to, amountMinor, timestamp) {
  const transaction = {
    id: formatTransactionId(nextIdRef.value),
    from,
    to,
    amountMinor,
    amount: fromMinorUnits(amountMinor),
    timestamp
  };
  nextIdRef.value += 1;
  transactions.push(transaction);
  return transaction;
}

function injectRapidTransfers(context, count) {
  const { accounts, transactions, metadata, nextIdRef, random, startTimestamp } = context;

  for (let index = 0; index < count; index += 1) {
    const selected = pickDistinctAccounts(accounts, 3, random);
    if (selected.length < 3) {
      break;
    }

    const [source, relay, destination] = selected;
    const timestamp = startTimestamp + index * 60_000;
    const amountMinor = randomInt(
      random,
      toMinorUnits(2_000),
      toMinorUnits(20_000)
    );
    const incoming = pushTransaction(
      transactions,
      nextIdRef,
      source,
      relay,
      amountMinor,
      timestamp
    );
    const outgoing = pushTransaction(
      transactions,
      nextIdRef,
      relay,
      destination,
      Math.round(amountMinor * 0.95),
      timestamp + randomInt(random, 60_000, 9 * 60_000)
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

function injectFanOut(context, count) {
  const { accounts, transactions, metadata, nextIdRef, random, startTimestamp } = context;

  for (let index = 0; index < count; index += 1) {
    const selected = pickDistinctAccounts(accounts, FAN_PATTERN_SIZE, random);
    if (selected.length < FAN_PATTERN_SIZE) {
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
        randomInt(random, toMinorUnits(100), toMinorUnits(2_000)),
        timestamp + randomInt(random, 0, 30_000)
      ).id
    );

    metadata.fanOut.push({
      source,
      targetCount: targets.length,
      transactionIds: txIds
    });
  }
}

function injectFanIn(context, count) {
  const { accounts, transactions, metadata, nextIdRef, random, startTimestamp } = context;

  for (let index = 0; index < count; index += 1) {
    const selected = pickDistinctAccounts(accounts, FAN_PATTERN_SIZE, random);
    if (selected.length < FAN_PATTERN_SIZE) {
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
        randomInt(random, toMinorUnits(100), toMinorUnits(2_000)),
        timestamp + randomInt(random, 0, 30_000)
      ).id
    );

    metadata.fanIn.push({
      target,
      sourceCount: sources.length,
      transactionIds: txIds
    });
  }
}

function injectFlaggedConnections(context, count) {
  const { accounts, transactions, metadata, nextIdRef, random, startTimestamp } = context;
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  for (let index = 0; index < count; index += 1) {
    const selected = pickDistinctAccounts(accounts, 3, random);
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
      randomInt(random, toMinorUnits(500), toMinorUnits(5_000)),
      timestamp
    );
    const second = pushTransaction(
      transactions,
      nextIdRef,
      intermediary,
      flaggedAccountId,
      randomInt(random, toMinorUnits(500), toMinorUnits(5_000)),
      timestamp + randomInt(random, 60_000, 5 * 60_000)
    );

    metadata.flaggedConnections.push({
      source,
      intermediary,
      flaggedAccountId,
      transactionIds: [first.id, second.id]
    });
  }
}

function resolvePatternCount(value, fieldName) {
  return assertCount(value ?? 0, {
    fieldName,
    max: MAX_SUSPICIOUS_PATTERNS
  });
}

export function injectSuspiciousPatterns(
  inputAccounts = [],
  inputTransactions = [],
  suspiciousPatterns = {},
  options = {}
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
    rapidTransfers: resolvePatternCount(
      suspiciousPatterns.rapidTransfers,
      "suspiciousPatterns.rapidTransfers"
    ),
    fanOut: resolvePatternCount(suspiciousPatterns.fanOut, "suspiciousPatterns.fanOut"),
    fanIn: resolvePatternCount(suspiciousPatterns.fanIn, "suspiciousPatterns.fanIn"),
    flaggedConnections: resolvePatternCount(
      suspiciousPatterns.flaggedConnections,
      "suspiciousPatterns.flaggedConnections"
    )
  };

  const random = resolveRandom(options);
  const startTimestamp = assertTimestamp(
    options.startTimestamp ?? Date.now(),
    "startTimestamp"
  );
  const nextIdRef = { value: transactions.length + 1 };

  const baseContext = { accounts, transactions, metadata, nextIdRef, random };

  injectRapidTransfers({ ...baseContext, startTimestamp }, patterns.rapidTransfers);
  injectFanOut(
    { ...baseContext, startTimestamp: startTimestamp + 10_000_000 },
    patterns.fanOut
  );
  injectFanIn(
    { ...baseContext, startTimestamp: startTimestamp + 20_000_000 },
    patterns.fanIn
  );
  injectFlaggedConnections(
    { ...baseContext, startTimestamp: startTimestamp + 30_000_000 },
    patterns.flaggedConnections
  );

  return {
    accounts,
    transactions,
    metadata
  };
}
