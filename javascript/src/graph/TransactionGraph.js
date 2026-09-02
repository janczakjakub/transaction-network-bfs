export class TransactionGraph {
  constructor(accounts = []) {
    this.outgoing = new Map();
    this.incoming = new Map();
    this.accountMeta = new Map();

    for (const account of accounts) {
      if (typeof account === "string") {
        this.addAccount(account);
      } else if (account && typeof account.id === "string") {
        this.addAccount(account.id, { flagged: Boolean(account.flagged) });
      }
    }
  }

  addAccount(accountId, metadata = {}) {
    if (!accountId) {
      return;
    }

    if (!this.outgoing.has(accountId)) {
      this.outgoing.set(accountId, []);
    }

    if (!this.incoming.has(accountId)) {
      this.incoming.set(accountId, []);
    }

    if (!this.accountMeta.has(accountId)) {
      this.accountMeta.set(accountId, { flagged: false });
    }

    const previous = this.accountMeta.get(accountId);
    this.accountMeta.set(accountId, { ...previous, ...metadata });
  }

  addTransaction(transaction) {
    if (!transaction || !transaction.from || !transaction.to) {
      throw new Error("Transaction must include from and to account IDs.");
    }

    const normalizedTransaction = {
      id: transaction.id ?? "",
      from: transaction.from,
      to: transaction.to,
      amount: Number(transaction.amount ?? 0),
      timestamp: Number(transaction.timestamp ?? Date.now())
    };

    this.addAccount(normalizedTransaction.from);
    this.addAccount(normalizedTransaction.to);

    this.outgoing.get(normalizedTransaction.from).push(normalizedTransaction);
    this.incoming.get(normalizedTransaction.to).push(normalizedTransaction);
  }

  addTransactions(transactions = []) {
    for (const transaction of transactions) {
      this.addTransaction(transaction);
    }
  }

  setAccountFlag(accountId, flagged = true) {
    this.addAccount(accountId, { flagged: Boolean(flagged) });
  }

  isFlagged(accountId) {
    return Boolean(this.accountMeta.get(accountId)?.flagged);
  }

  getOutgoing(accountId) {
    return this.outgoing.get(accountId) ?? [];
  }

  getIncoming(accountId) {
    return this.incoming.get(accountId) ?? [];
  }

  getOutgoingNeighbors(accountId) {
    const neighbors = new Set();

    for (const transaction of this.getOutgoing(accountId)) {
      neighbors.add(transaction.to);
    }

    return [...neighbors];
  }

  getIncomingNeighbors(accountId) {
    const neighbors = new Set();

    for (const transaction of this.getIncoming(accountId)) {
      neighbors.add(transaction.from);
    }

    return [...neighbors];
  }

  getAccounts() {
    return [...this.outgoing.keys()];
  }

  getAccountData(accountId) {
    return this.accountMeta.get(accountId) ?? null;
  }
}
