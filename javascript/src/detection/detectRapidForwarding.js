import { fromMinorUnits, getAmountMinor, isRatioWithin, ratioOf } from "../money/money.js";

function toMinutes(milliseconds) {
  return milliseconds / 60_000;
}

export function detectRapidForwarding(
  accountId,
  incomingTransactions = [],
  outgoingTransactions = [],
  options = {}
) {
  const maxDelayMinutes = options.maxDelayMinutes ?? 10;
  const minForwardRatio = options.minForwardRatio ?? 0.9;
  const maxForwardRatio = options.maxForwardRatio ?? 1.1;
  const maxDelayMs = maxDelayMinutes * 60_000;

  const sortedIncoming = [...incomingTransactions].sort(
    (left, right) => left.timestamp - right.timestamp
  );
  const sortedOutgoing = [...outgoingTransactions].sort(
    (left, right) => left.timestamp - right.timestamp
  );
  const usedOutgoingIds = new Set();
  const matches = [];

  for (const incoming of sortedIncoming) {
    const receivedMinor = getAmountMinor(incoming);
    if (receivedMinor <= 0) {
      continue;
    }

    for (const outgoing of sortedOutgoing) {
      if (usedOutgoingIds.has(outgoing.id)) {
        continue;
      }

      if (outgoing.timestamp < incoming.timestamp) {
        continue;
      }

      const delayMs = outgoing.timestamp - incoming.timestamp;
      if (delayMs > maxDelayMs) {
        break;
      }

      const forwardedMinor = getAmountMinor(outgoing);
      if (
        !isRatioWithin(forwardedMinor, receivedMinor, minForwardRatio, maxForwardRatio)
      ) {
        continue;
      }

      usedOutgoingIds.add(outgoing.id);
      matches.push({
        accountId,
        incomingTransactionId: incoming.id,
        outgoingTransactionId: outgoing.id,
        receivedAmountMinor: receivedMinor,
        forwardedAmountMinor: forwardedMinor,
        receivedAmount: fromMinorUnits(receivedMinor),
        forwardedAmount: fromMinorUnits(forwardedMinor),
        ratio: ratioOf(forwardedMinor, receivedMinor),
        delayMinutes: Number(toMinutes(delayMs).toFixed(3))
      });
      break;
    }
  }

  return {
    accountId,
    detected: matches.length > 0,
    count: matches.length,
    matches,
    config: {
      maxDelayMinutes,
      minForwardRatio,
      maxForwardRatio
    }
  };
}
