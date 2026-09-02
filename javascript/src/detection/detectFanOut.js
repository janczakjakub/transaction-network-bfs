export function detectFanOut(accountId, outgoingAccountsCount, options = {}) {
  const threshold = options.threshold ?? 20;
  const detected = outgoingAccountsCount >= threshold;

  return {
    accountId,
    detected,
    outgoingAccountsCount,
    threshold,
    overflow: detected ? outgoingAccountsCount - threshold : 0
  };
}
