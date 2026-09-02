function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTransactionId(index) {
  return `TX-${String(index).padStart(6, "0")}`;
}

function pickDifferentAccount(accounts, sourceAccountId) {
  if (accounts.length < 2) {
    return sourceAccountId;
  }

  let targetAccount = accounts[randomInt(0, accounts.length - 1)];
  while (targetAccount.id === sourceAccountId) {
    targetAccount = accounts[randomInt(0, accounts.length - 1)];
  }
  return targetAccount.id;
}

export function generateTransactions(options = {}) {
  const accounts = options.accounts ?? [];
  const totalTransactions = Math.max(0, Number(options.transactions) || 0);
  const startTimestamp = Number(options.startTimestamp ?? Date.now() - 86_400_000);
  const maxTimeSpreadMs = Number(options.maxTimeSpreadMs ?? 86_400_000);
  const minAmount = Number(options.minAmount ?? 10);
  const maxAmount = Number(options.maxAmount ?? 10_000);
  const initialIndex = Number(options.startIndex ?? 1);

  if (accounts.length < 2 || totalTransactions === 0) {
    return [];
  }

  return Array.from({ length: totalTransactions }, (_, offset) => {
    const fromAccount = accounts[randomInt(0, accounts.length - 1)];
    const toAccountId = pickDifferentAccount(accounts, fromAccount.id);
    const amount = randomInt(minAmount, maxAmount);
    const timestamp = startTimestamp + randomInt(0, maxTimeSpreadMs);

    return {
      id: formatTransactionId(initialIndex + offset),
      from: fromAccount.id,
      to: toAccountId,
      amount,
      timestamp
    };
  });
}
