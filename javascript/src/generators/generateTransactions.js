import { fromMinorUnits, toMinorUnits } from "../money/money.js";
import { formatTransactionId } from "../utils/ids.js";
import { randomInt, resolveRandom } from "../utils/random.js";
import { assertCount, assertTimestamp } from "../validation/assertions.js";
import { MAX_TRANSACTIONS } from "./limits.js";

const MAX_PICK_ATTEMPTS = 32;

function pickDifferentAccount(accounts, sourceAccountId, random) {
  if (accounts.length < 2) {
    return sourceAccountId;
  }

  for (let attempt = 0; attempt < MAX_PICK_ATTEMPTS; attempt += 1) {
    const candidate = accounts[randomInt(random, 0, accounts.length - 1)];
    if (candidate.id !== sourceAccountId) {
      return candidate.id;
    }
  }

  // Deterministyczny fallback - chroni przed pętlą bez końca przy zduplikowanych ID.
  const fallback = accounts.find((account) => account.id !== sourceAccountId);
  return fallback ? fallback.id : sourceAccountId;
}

export function generateTransactions(options = {}) {
  const accounts = options.accounts ?? [];
  const totalTransactions = assertCount(options.transactions ?? 0, {
    fieldName: "transactions",
    max: MAX_TRANSACTIONS
  });
  const startTimestamp = assertTimestamp(
    options.startTimestamp ?? Date.now() - 86_400_000,
    "startTimestamp"
  );
  const maxTimeSpreadMs = assertCount(options.maxTimeSpreadMs ?? 86_400_000, {
    fieldName: "maxTimeSpreadMs"
  });
  const minAmountMinor = toMinorUnits(options.minAmount ?? 10, "minAmount");
  const maxAmountMinor = toMinorUnits(options.maxAmount ?? 10_000, "maxAmount");
  const initialIndex = assertCount(options.startIndex ?? 1, {
    fieldName: "startIndex"
  });
  const random = resolveRandom(options);

  if (minAmountMinor > maxAmountMinor) {
    throw new RangeError("minAmount must not be greater than maxAmount.");
  }

  if (accounts.length < 2 || totalTransactions === 0) {
    return [];
  }

  return Array.from({ length: totalTransactions }, (_, offset) => {
    const fromAccount = accounts[randomInt(random, 0, accounts.length - 1)];
    const toAccountId = pickDifferentAccount(accounts, fromAccount.id, random);
    const amountMinor = randomInt(random, minAmountMinor, maxAmountMinor);
    const timestamp = startTimestamp + randomInt(random, 0, maxTimeSpreadMs);

    return {
      id: formatTransactionId(initialIndex + offset),
      from: fromAccount.id,
      to: toAccountId,
      amountMinor,
      amount: fromMinorUnits(amountMinor),
      timestamp
    };
  });
}
