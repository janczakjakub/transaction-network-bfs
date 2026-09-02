import { assertMinorUnits, fromMinorUnits, toMinorUnits } from "../money/money.js";
import { assertAccountId, assertTimestamp } from "../validation/assertions.js";

function assertTransactionId(transactionId) {
  if (transactionId === undefined || transactionId === null) {
    throw new TypeError("transaction.id must be a non-empty string.");
  }

  if (typeof transactionId !== "string" || transactionId.trim().length === 0) {
    throw new TypeError("transaction.id must be a non-empty string.");
  }

  return transactionId;
}

export class TransactionGraph {
  constructor(accounts = []) {
    this.outgoing = new Map();
    this.incoming = new Map();
    this.accountMeta = new Map();
    this.transactionIds = new Set();

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

  hasAccount(accountId) {
    return this.outgoing.has(accountId);
  }

  addTransaction(transaction) {
    if (!transaction || typeof transaction !== "object") {
      throw new TypeError("Transaction must be an object.");
    }

    const transactionId = assertTransactionId(transaction.id);

    if (this.transactionIds.has(transactionId)) {
      throw new Error(`Transaction with id "${transactionId}" already exists`);
    }

    assertAccountId(transaction.from, "transaction.from");
    assertAccountId(transaction.to, "transaction.to");

    const amountMinor =
      transaction.amountMinor === undefined
        ? toMinorUnits(transaction.amount ?? 0, "transaction.amount")
        : assertMinorUnits(transaction.amountMinor, "transaction.amountMinor");

    const normalizedTransaction = {
      id: transactionId,
      from: transaction.from,
      to: transaction.to,
      amountMinor,
      amount: fromMinorUnits(amountMinor),
      timestamp: assertTimestamp(
        transaction.timestamp ?? Date.now(),
        "transaction.timestamp"
      )
    };

    this.addAccount(normalizedTransaction.from);
    this.addAccount(normalizedTransaction.to);

    this.outgoing.get(normalizedTransaction.from).push(normalizedTransaction);
    this.incoming.get(normalizedTransaction.to).push(normalizedTransaction);
    this.transactionIds.add(transactionId);
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
