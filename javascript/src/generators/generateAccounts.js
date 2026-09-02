function formatAccountId(index) {
  return `ACC-${String(index).padStart(6, "0")}`;
}

export function generateAccounts(count, options = {}) {
  const total = Math.max(0, Number(count) || 0);
  const flaggedRatio = options.flaggedRatio ?? 0;

  return Array.from({ length: total }, (_, index) => {
    const id = formatAccountId(index + 1);
    const flagged = Math.random() < flaggedRatio;

    return {
      id,
      flagged
    };
  });
}
