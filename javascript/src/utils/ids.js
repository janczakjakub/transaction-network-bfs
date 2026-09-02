export function formatAccountId(index) {
  return `ACC-${String(index).padStart(6, "0")}`;
}

export function formatTransactionId(index) {
  return `TX-${String(index).padStart(6, "0")}`;
}
