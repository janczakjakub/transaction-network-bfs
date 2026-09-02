export function detectFanIn(accountId, incomingAccountsCount, options = {}) {
  const threshold = options.threshold ?? 20;
  const detected = incomingAccountsCount >= threshold;

  return {
    accountId,
    detected,
    incomingAccountsCount,
    threshold,
    overflow: detected ? incomingAccountsCount - threshold : 0
  };
}
