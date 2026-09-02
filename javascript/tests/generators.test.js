import test from "node:test";
import assert from "node:assert/strict";

import { generateAccounts } from "../src/generators/generateAccounts.js";
import { generateTransactions } from "../src/generators/generateTransactions.js";
import { generateTransactionNetwork } from "../src/generators/generateTransactionNetwork.js";
import { MAX_ACCOUNTS, MAX_TRANSACTIONS } from "../src/generators/limits.js";

const NETWORK_OPTIONS = {
  accounts: 150,
  transactions: 600,
  seed: "review-fixture",
  startTimestamp: 0,
  accountOptions: { flaggedRatio: 0.05 },
  suspiciousPatterns: { rapidTransfers: 2, fanOut: 1, fanIn: 1, flaggedConnections: 2 }
};

test("the same seed produces an identical network", () => {
  const first = generateTransactionNetwork(NETWORK_OPTIONS);
  const second = generateTransactionNetwork(NETWORK_OPTIONS);

  assert.deepEqual(first.transactions, second.transactions);
  assert.deepEqual(first.accounts, second.accounts);
  assert.deepEqual(first.metadata, second.metadata);
});

test("a different seed produces a different network", () => {
  const first = generateTransactionNetwork(NETWORK_OPTIONS);
  const second = generateTransactionNetwork({ ...NETWORK_OPTIONS, seed: "other-seed" });

  assert.notDeepEqual(first.transactions, second.transactions);
});

test("seeded accounts keep deterministic ids and flags", () => {
  const options = { seed: 42, flaggedRatio: 0.5 };

  assert.deepEqual(generateAccounts(20, options), generateAccounts(20, options));
  assert.equal(generateAccounts(3, options)[0].id, "ACC-000001");
});

test("generated amounts are integer minor units", () => {
  const accounts = generateAccounts(10, { seed: 1 });
  const transactions = generateTransactions({
    accounts,
    transactions: 50,
    seed: 1,
    startTimestamp: 0
  });

  for (const transaction of transactions) {
    assert.equal(Number.isSafeInteger(transaction.amountMinor), true);
    assert.ok(transaction.amountMinor > 0);
    assert.notEqual(transaction.from, transaction.to);
  }
});

test("generators reject sizes above the hard limits", () => {
  assert.throws(() => generateAccounts(MAX_ACCOUNTS + 1), RangeError);
  assert.throws(
    () =>
      generateTransactions({
        accounts: generateAccounts(2, { seed: 1 }),
        transactions: MAX_TRANSACTIONS + 1
      }),
    RangeError
  );
  assert.throws(() => generateTransactionNetwork({ accounts: 1e12 }), RangeError);
});

test("generators reject non-numeric sizes", () => {
  assert.throws(() => generateAccounts("many"), TypeError);
  assert.throws(() => generateAccounts(Number.NaN), TypeError);
});

test("generateTransactions returns nothing when there is no pair to connect", () => {
  assert.deepEqual(
    generateTransactions({ accounts: generateAccounts(1, { seed: 1 }), transactions: 10 }),
    []
  );
  assert.deepEqual(
    generateTransactions({ accounts: generateAccounts(5, { seed: 1 }), transactions: 0 }),
    []
  );
});
