import test from "node:test";
import assert from "node:assert/strict";

import { getRiskLevel } from "../src/risk/getRiskLevel.js";

test("getRiskLevel maps every documented threshold boundary", () => {
  const boundaries = [
    [0, "LOW"],
    [29, "LOW"],
    [30, "MEDIUM"],
    [59, "MEDIUM"],
    [60, "HIGH"],
    [79, "HIGH"],
    [80, "CRITICAL"],
    [100, "CRITICAL"]
  ];

  for (const [score, expected] of boundaries) {
    assert.equal(getRiskLevel(score), expected, `score ${score}`);
  }
});

test("getRiskLevel clamps behaviour outside the documented range", () => {
  assert.equal(getRiskLevel(-10), "LOW");
  assert.equal(getRiskLevel(1_000), "CRITICAL");
});

test("getRiskLevel rejects non-numeric scores", () => {
  assert.throws(() => getRiskLevel(Number.NaN), TypeError);
  assert.throws(() => getRiskLevel("80"), TypeError);
  assert.throws(() => getRiskLevel(undefined), TypeError);
});
