export const MINOR_UNITS_PER_MAJOR = 100;

// Skala używana przy porównywaniu proporcji kwot bez arytmetyki zmiennoprzecinkowej.
const RATIO_SCALE = 1_000_000;

function isBlank(value) {
  return value === undefined || value === null || value === "";
}

/**
 * Zamienia kwotę w jednostkach głównych (np. złotówki) na całkowite jednostki minor (grosze).
 * Kwoty pieniężne są przechowywane jako integer, żeby uniknąć błędów zaokrągleń IEEE-754.
 */
export function toMinorUnits(value, fieldName = "amount") {
  if (isBlank(value)) {
    return 0;
  }

  const parsed = typeof value === "string" ? Number(value) : value;

  if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
    throw new TypeError(`${fieldName} must be a finite number, received: ${String(value)}`);
  }

  if (parsed < 0) {
    throw new RangeError(`${fieldName} must not be negative, received: ${parsed}`);
  }

  // toFixed(6) zdejmuje reprezentacyjny błąd mnożenia (np. 1.005 * 100 = 100.49999999999999).
  const minor = Math.round(Number((parsed * MINOR_UNITS_PER_MAJOR).toFixed(6)));

  if (!Number.isSafeInteger(minor)) {
    throw new RangeError(`${fieldName} exceeds the safe integer range, received: ${parsed}`);
  }

  return minor;
}

export function fromMinorUnits(minorUnits) {
  return minorUnits / MINOR_UNITS_PER_MAJOR;
}

export function assertMinorUnits(value, fieldName = "amountMinor") {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`${fieldName} must be a safe integer, received: ${String(value)}`);
  }

  if (value < 0) {
    throw new RangeError(`${fieldName} must not be negative, received: ${value}`);
  }

  return value;
}

/**
 * Zwraca kwotę transakcji w jednostkach minor. Transakcje przechodzące przez
 * TransactionGraph mają `amountMinor`; surowe obiekty wpadają na konwersję z `amount`.
 */
export function getAmountMinor(transaction) {
  if (!transaction) {
    return 0;
  }

  if (Number.isSafeInteger(transaction.amountMinor)) {
    return transaction.amountMinor;
  }

  return toMinorUnits(transaction.amount ?? 0);
}

/**
 * Sprawdza, czy `forwardedMinor / receivedMinor` mieści się w przedziale [minRatio, maxRatio]
 * bez dzielenia zmiennoprzecinkowego - przez mnożenie krzyżowe na BigInt.
 */
export function isRatioWithin(forwardedMinor, receivedMinor, minRatio, maxRatio) {
  if (receivedMinor <= 0) {
    return false;
  }

  const forwarded = BigInt(forwardedMinor) * BigInt(RATIO_SCALE);
  const received = BigInt(receivedMinor);
  const lowerBound = received * BigInt(Math.round(minRatio * RATIO_SCALE));
  const upperBound = received * BigInt(Math.round(maxRatio * RATIO_SCALE));

  return forwarded >= lowerBound && forwarded <= upperBound;
}

export function ratioOf(forwardedMinor, receivedMinor, fractionDigits = 3) {
  if (receivedMinor <= 0) {
    return null;
  }

  const scaled = (BigInt(forwardedMinor) * BigInt(RATIO_SCALE)) / BigInt(receivedMinor);
  return Number((Number(scaled) / RATIO_SCALE).toFixed(fractionDigits));
}
