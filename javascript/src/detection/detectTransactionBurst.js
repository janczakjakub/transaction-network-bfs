function sortByTimestamp(transactions) {
  return [...transactions].sort((left, right) => left.timestamp - right.timestamp);
}

export function detectTransactionBurst(
  accountId,
  transactions = [],
  options = {}
) {
  const maxWindowMinutes = options.maxWindowMinutes ?? 30;
  const minTransactions = options.minTransactions ?? 5;
  const windowMs = maxWindowMinutes * 60_000;
  const sortedTransactions = sortByTimestamp(transactions);

  let head = 0;
  let peakTransactions = 0;
  let peakRange = null;

  for (let tail = 0; tail < sortedTransactions.length; tail += 1) {
    const tailTimestamp = sortedTransactions[tail].timestamp;

    while (tailTimestamp - sortedTransactions[head].timestamp > windowMs) {
      head += 1;
    }

    const currentCount = tail - head + 1;
    if (currentCount > peakTransactions) {
      peakTransactions = currentCount;
      peakRange = {
        from: sortedTransactions[head].timestamp,
        to: tailTimestamp
      };
    }
  }

  return {
    accountId,
    detected: peakTransactions >= minTransactions,
    peakTransactions,
    minTransactions,
    maxWindowMinutes,
    peakRange
  };
}
