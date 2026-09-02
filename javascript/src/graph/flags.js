export function toFlaggedSet(flaggedAccounts) {
  if (flaggedAccounts instanceof Set) {
    return flaggedAccounts;
  }

  return new Set(flaggedAccounts ?? []);
}

/**
 * Łączy oznaczenia zapisane w grafie z listą kont podaną przez wywołującego.
 */
export function createFlagCheck(graph, flaggedAccounts) {
  const flaggedSet = toFlaggedSet(flaggedAccounts);

  return (accountId) => flaggedSet.has(accountId) || graph.isFlagged(accountId);
}
