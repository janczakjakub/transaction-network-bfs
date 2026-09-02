import { MAX_ACCOUNTS, MAX_TRANSACTIONS } from "./generators/limits.js";
import { assertCount } from "./validation/assertions.js";

export const MAX_CLI_DEPTH = 20;

export const DEFAULT_ACCOUNTS = 10_000;
export const DEFAULT_TRANSACTIONS = 100_000;
export const DEFAULT_MAX_DEPTH = 3;

/**
 * Zmienne środowiskowe pochodzą spoza aplikacji, więc muszą przejść walidację zakresu -
 * bez niej `ACCOUNTS=1e12` próbowałoby zaalokować tablicę i wywrócić proces.
 */
export function readEnvCount(name, defaultValue, max, env) {
  return assertCount(env[name] ?? defaultValue, {
    fieldName: name,
    min: 0,
    max
  });
}

export function readConfig(env = process.env) {
  return {
    accountCount: readEnvCount("ACCOUNTS", DEFAULT_ACCOUNTS, MAX_ACCOUNTS, env),
    transactionCount: readEnvCount("TRANSACTIONS", DEFAULT_TRANSACTIONS, MAX_TRANSACTIONS, env),
    maxDepth: readEnvCount("MAX_DEPTH", DEFAULT_MAX_DEPTH, MAX_CLI_DEPTH, env),
    seed: env.SEED
  };
}
