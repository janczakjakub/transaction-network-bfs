import test from "node:test";
import assert from "node:assert/strict";

import {
  fromMinorUnits,
  getAmountMinor,
  isRatioWithin,
  ratioOf,
  toMinorUnits
} from "../src/money/money.js";

test("toMinorUnits converts major units to integer minor units", () => {
  assert.equal(toMinorUnits(10), 1_000);
  assert.equal(toMinorUnits(10.55), 1_055);
  assert.equal(toMinorUnits(0), 0);
  assert.equal(toMinorUnits(undefined), 0);
});

test("toMinorUnits is immune to float representation error", () => {
  // 1.005 * 100 daje 100.49999999999999 w arytmetyce IEEE-754.
  assert.equal(toMinorUnits(1.005), 101);
  assert.equal(toMinorUnits(0.1) + toMinorUnits(0.2), toMinorUnits(0.3));
  assert.notEqual(0.1 + 0.2, 0.3);
});

test("toMinorUnits rejects invalid amounts", () => {
  assert.throws(() => toMinorUnits(Number.NaN), TypeError);
  assert.throws(() => toMinorUnits(Number.POSITIVE_INFINITY), TypeError);
  assert.throws(() => toMinorUnits("not-a-number"), TypeError);
  assert.throws(() => toMinorUnits(-1), RangeError);
  assert.throws(() => toMinorUnits(Number.MAX_SAFE_INTEGER), RangeError);
});

test("fromMinorUnits restores major units", () => {
  assert.equal(fromMinorUnits(1_055), 10.55);
  assert.equal(fromMinorUnits(0), 0);
});

test("getAmountMinor prefers amountMinor and falls back to amount", () => {
  assert.equal(getAmountMinor({ amountMinor: 1_234, amount: 999 }), 1_234);
  assert.equal(getAmountMinor({ amount: 12.34 }), 1_234);
  assert.equal(getAmountMinor(null), 0);
});

test("getAmountMinor rejects negative amountMinor", () => {
  assert.throws(() => getAmountMinor({ amountMinor: -100 }), RangeError);
});

test("isRatioWithin compares ratios without float division", () => {
  assert.equal(isRatioWithin(960_000, 1_000_000, 0.9, 1.1), true);
  assert.equal(isRatioWithin(800_000, 1_000_000, 0.9, 1.1), false);
  assert.equal(isRatioWithin(1_200_000, 1_000_000, 0.9, 1.1), false);
  assert.equal(isRatioWithin(100, 0, 0.9, 1.1), false);
});

test("isRatioWithin stays exact near the safe integer boundary", () => {
  const huge = Number.MAX_SAFE_INTEGER;

  assert.equal(isRatioWithin(huge, huge, 0.9, 1.1), true);
  assert.equal(isRatioWithin(huge - 1, huge, 0.9, 1.1), true);
});

test("ratioOf reports the forwarded share", () => {
  assert.equal(ratioOf(9_600, 10_000), 0.96);
  assert.equal(ratioOf(10_000, 10_000), 1);
  assert.equal(ratioOf(100, 0), null);
});
