import test from "node:test";
import assert from "node:assert/strict";

import { TransactionGraph } from "../src/graph/TransactionGraph.js";

test("addTransaction rejects missing or empty account IDs", () => {
  const graph = new TransactionGraph();

  assert.throws(
    () => graph.addTransaction({ id: "TX-1", to: "ACC-B", amount: 1 }),
    TypeError
  );
  assert.throws(
    () => graph.addTransaction({ id: "TX-2", from: "", to: "ACC-B", amount: 1 }),
    TypeError
  );
  assert.throws(
    () => graph.addTransaction({ id: "TX-3", from: "ACC-A", to: "", amount: 1 }),
    TypeError
  );
  assert.throws(() => graph.addTransaction(null), TypeError);
  assert.equal(graph.getAccounts().length, 0);
});

test("addTransaction rejects invalid amounts and timestamps", () => {
  const graph = new TransactionGraph();
  const base = { id: "TX-BASE", from: "ACC-A", to: "ACC-B" };

  assert.throws(() => graph.addTransaction({ ...base, amount: Number.NaN }), TypeError);
  assert.throws(
    () => graph.addTransaction({ ...base, amount: Number.POSITIVE_INFINITY }),
    TypeError
  );
  assert.throws(() => graph.addTransaction({ ...base, amount: -5 }), RangeError);
  assert.throws(
    () => graph.addTransaction({ ...base, amount: 1, timestamp: Number.NaN }),
    TypeError
  );
});

test("addTransaction accepts a valid transaction.id", () => {
  const graph = new TransactionGraph();

  graph.addTransaction({
    id: "TX-VALID",
    from: "ACC-A",
    to: "ACC-B",
    amount: 100,
    timestamp: 1
  });

  const [stored] = graph.getOutgoing("ACC-A");
  assert.equal(stored.id, "TX-VALID");
});

test("addTransaction rejects a missing transaction.id", () => {
  const graph = new TransactionGraph();

  assert.throws(
    () =>
      graph.addTransaction({
        from: "ACC-A",
        to: "ACC-B",
        amount: 100,
        timestamp: 1
      }),
    TypeError
  );
});

test("addTransaction rejects an empty transaction.id", () => {
  const graph = new TransactionGraph();

  assert.throws(
    () =>
      graph.addTransaction({
        id: "",
        from: "ACC-A",
        to: "ACC-B",
        amount: 100,
        timestamp: 1
      }),
    TypeError
  );
});

test("addTransaction rejects transaction.id containing only whitespace", () => {
  const graph = new TransactionGraph();

  assert.throws(
    () =>
      graph.addTransaction({
        id: "   ",
        from: "ACC-A",
        to: "ACC-B",
        amount: 100,
        timestamp: 1
      }),
    TypeError
  );
});

test("addTransaction rejects duplicate transaction.id values", () => {
  const graph = new TransactionGraph();
  const transaction = {
    id: "TX-1",
    from: "ACC-A",
    to: "ACC-B",
    amount: 100,
    timestamp: 1
  };

  graph.addTransaction(transaction);

  assert.throws(
    () =>
      graph.addTransaction({
        ...transaction,
        from: "ACC-B",
        to: "ACC-C"
      }),
    /Transaction with id "TX-1" already exists/
  );
});

test("addTransaction normalizes amounts to integer minor units", () => {
  const graph = new TransactionGraph();
  graph.addTransaction({
    id: "TX-1",
    from: "ACC-A",
    to: "ACC-B",
    amount: 10.55,
    timestamp: 1
  });

  const [stored] = graph.getOutgoing("ACC-A");

  assert.equal(stored.amountMinor, 1_055);
  assert.equal(stored.amount, 10.55);
  assert.equal(Number.isSafeInteger(stored.amountMinor), true);
});

test("addTransaction accepts amountMinor directly", () => {
  const graph = new TransactionGraph();
  graph.addTransaction({
    id: "TX-1",
    from: "ACC-A",
    to: "ACC-B",
    amountMinor: 2_500,
    timestamp: 1
  });

  const [stored] = graph.getOutgoing("ACC-A");

  assert.equal(stored.amountMinor, 2_500);
  assert.equal(stored.amount, 25);
});

test("hasAccount reflects known accounts only", () => {
  const graph = new TransactionGraph([{ id: "ACC-A" }]);

  assert.equal(graph.hasAccount("ACC-A"), true);
  assert.equal(graph.hasAccount("ACC-MISSING"), false);
});

test("flags are readable through isFlagged and setAccountFlag", () => {
  const graph = new TransactionGraph([{ id: "ACC-A", flagged: true }, { id: "ACC-B" }]);

  assert.equal(graph.isFlagged("ACC-A"), true);
  assert.equal(graph.isFlagged("ACC-B"), false);
  assert.equal(graph.isFlagged("ACC-MISSING"), false);

  graph.setAccountFlag("ACC-B");
  assert.equal(graph.isFlagged("ACC-B"), true);
});

test("self-loop is stored on both sides of the same account", () => {
  const graph = new TransactionGraph();
  graph.addTransaction({
    id: "TX-1",
    from: "ACC-A",
    to: "ACC-A",
    amount: 100,
    timestamp: 1
  });

  assert.equal(graph.getOutgoing("ACC-A").length, 1);
  assert.equal(graph.getIncoming("ACC-A").length, 1);
  assert.deepEqual(graph.getOutgoingNeighbors("ACC-A"), ["ACC-A"]);
});
