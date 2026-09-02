import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_ACCOUNTS,
  DEFAULT_MAX_DEPTH,
  DEFAULT_TRANSACTIONS,
  MAX_CLI_DEPTH,
  readConfig
} from "../src/config.js";
import { MAX_ACCOUNTS, MAX_TRANSACTIONS } from "../src/generators/limits.js";

test("readConfig returns defaults for an empty environment", () => {
  assert.deepEqual(readConfig({}), {
    accountCount: DEFAULT_ACCOUNTS,
    transactionCount: DEFAULT_TRANSACTIONS,
    maxDepth: DEFAULT_MAX_DEPTH,
    seed: undefined
  });
});

test("readConfig accepts valid overrides", () => {
  assert.deepEqual(
    readConfig({
      ACCOUNTS: "5000",
      TRANSACTIONS: "20000",
      MAX_DEPTH: "5",
      SEED: "demo"
    }),
    {
      accountCount: 5000,
      transactionCount: 20000,
      maxDepth: 5,
      seed: "demo"
    }
  );
});

test("readConfig rejects ACCOUNTS above the hard limit", () => {
  assert.throws(
    () => readConfig({ ACCOUNTS: String(MAX_ACCOUNTS + 1) }),
    RangeError
  );
  assert.throws(() => readConfig({ ACCOUNTS: "1e12" }), RangeError);
});

test("readConfig rejects non-numeric ACCOUNTS", () => {
  assert.throws(() => readConfig({ ACCOUNTS: "many" }), TypeError);
});

test("readConfig rejects MAX_DEPTH above the CLI limit", () => {
  assert.throws(
    () => readConfig({ MAX_DEPTH: String(MAX_CLI_DEPTH + 1) }),
    RangeError
  );
});

test("readConfig rejects negative MAX_DEPTH", () => {
  assert.throws(() => readConfig({ MAX_DEPTH: "-1" }), RangeError);
});

test("readConfig rejects TRANSACTIONS above the hard limit", () => {
  assert.throws(
    () => readConfig({ TRANSACTIONS: String(MAX_TRANSACTIONS + 1) }),
    RangeError
  );
});
