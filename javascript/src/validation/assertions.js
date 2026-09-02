export function assertGraph(graph, fieldName = "graph") {
  if (
    !graph ||
    typeof graph.getOutgoing !== "function" ||
    typeof graph.getIncoming !== "function"
  ) {
    throw new TypeError(`${fieldName} must be a TransactionGraph instance.`);
  }

  return graph;
}

export function assertAccountId(accountId, fieldName = "accountId") {
  if (typeof accountId !== "string" || accountId.length === 0) {
    throw new TypeError(
      `${fieldName} must be a non-empty string, received: ${String(accountId)}`
    );
  }

  return accountId;
}

/**
 * Zwraca całkowitą głębokość przeszukiwania. Brak wartości oznacza `defaultValue` -
 * nigdy nieskończoność, żeby wywołanie bez limitu nie przeszukiwało całego grafu.
 */
export function resolveMaxDepth(value, defaultValue, fieldName = "maxDepth") {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const parsed = typeof value === "string" ? Number(value) : value;

  if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
    throw new TypeError(
      `${fieldName} must be a finite number, received: ${String(value)}`
    );
  }

  if (parsed < 0) {
    throw new RangeError(`${fieldName} must not be negative, received: ${parsed}`);
  }

  return Math.floor(parsed);
}

export function assertCount(value, options = {}) {
  const fieldName = options.fieldName ?? "count";
  const max = options.max ?? Number.MAX_SAFE_INTEGER;
  const min = options.min ?? 0;
  const parsed = typeof value === "string" ? Number(value) : value;

  if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
    throw new TypeError(
      `${fieldName} must be a finite number, received: ${String(value)}`
    );
  }

  const normalized = Math.floor(parsed);

  if (normalized < min || normalized > max) {
    throw new RangeError(
      `${fieldName} must be between ${min} and ${max}, received: ${normalized}`
    );
  }

  return normalized;
}

export function assertTimestamp(value, fieldName = "timestamp") {
  const parsed = typeof value === "string" ? Number(value) : value;

  if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
    throw new TypeError(
      `${fieldName} must be a finite number, received: ${String(value)}`
    );
  }

  return parsed;
}
