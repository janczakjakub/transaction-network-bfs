import { performance } from "node:perf_hooks";

import {
  assertAccountId,
  assertCount,
  assertGraph,
  resolveMaxDepth
} from "../validation/assertions.js";

/**
 * Domyślny limit głębokości. Brak jawnego `maxDepth` nie oznacza nieskończoności -
 * inaczej pojedyncze wywołanie na dużym grafie przeszukiwałoby całą sieć.
 */
export const DEFAULT_MAX_DEPTH = 10;

/** Bezpiecznik na wyczerpanie pamięci przy grafach o nieoczekiwanej wielkości. */
export const DEFAULT_MAX_VISITED = 1_000_000;

function normalizeDirection(direction) {
  return direction === "incoming" ? "incoming" : "outgoing";
}

function getNeighborAccountId(transaction, direction) {
  return direction === "incoming" ? transaction.from : transaction.to;
}

function toRoundedMs(startMs) {
  return Number((performance.now() - startMs).toFixed(3));
}

/** Mapa bez prototypu - klucze pochodzą z danych wejściowych (np. `__proto__`). */
function mapToNullProtoObject(map) {
  const obj = Object.create(null);
  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }
  return obj;
}

function buildPath(parentByAccount, sourceAccount, targetAccount) {
  const path = [];
  let current = targetAccount;

  while (current !== undefined) {
    path.push(current);
    if (current === sourceAccount) {
      break;
    }

    current = parentByAccount.get(current);
  }

  if (path[path.length - 1] !== sourceAccount) {
    return [];
  }

  path.reverse();
  return path;
}

/**
 * Odtwarza najkrótszą ścieżkę do dowolnego konta odwiedzonego w danym przebiegu BFS.
 * Pozwala jednemu przejściu obsłużyć wiele zapytań o ścieżkę - `O(długość ścieżki)`.
 */
export function buildPathTo(result, targetAccount) {
  if (!result || !result.parentByAccount || !result.parentByAccount.has(targetAccount)) {
    return [];
  }

  return buildPath(result.parentByAccount, result.sourceAccount, targetAccount);
}

function emptyResult(sourceAccount, startedAt) {
  return {
    found: false,
    foundAccount: null,
    path: [],
    pathLength: null,
    visitedAccounts: 0,
    transactionsChecked: 0,
    maxQueueSize: 0,
    maxDepthReached: 0,
    truncated: false,
    executionTimeMs: toRoundedMs(startedAt),
    reachedAccounts: [],
    depthByAccount: Object.create(null),
    visitOrder: [],
    parentByAccount: new Map(),
    sourceAccount
  };
}

/**
 * Przeszukiwanie wszerz po grafie transakcji.
 *
 * Złożoność czasowa: `O(V + E)` - każde konto trafia do kolejki najwyżej raz
 * (oznaczanie `visited` przy dodaniu do kolejki), a każda transakcja jest sprawdzana
 * najwyżej raz w danym kierunku. Dequeue jest amortyzowanym `O(1)` dzięki indeksowi
 * `head` zamiast `Array.prototype.shift()`.
 *
 * Złożoność pamięciowa: `O(V)` - zbiór `visited`, mapy `parent`/`depth` oraz kolejka
 * rosną liniowo z liczbą osiągniętych kont.
 *
 * Wpływ `maxDepth`: ogranicza przeszukiwanie do kuli o promieniu `maxDepth`. Praktyczny
 * koszt to `O(V_d + E_d)`, gdzie `V_d`/`E_d` to konta i transakcje w zasięgu `maxDepth`.
 * W rzadkim grafie o średnim stopniu `b` daje to w przybliżeniu `O(b^maxDepth)`.
 *
 * Funkcja nie modyfikuje przekazanego grafu.
 */
export function bfs(graph, sourceAccount, options = {}) {
  const startedAt = performance.now();

  assertGraph(graph);
  assertAccountId(sourceAccount, "sourceAccount");

  const maxDepth = resolveMaxDepth(options.maxDepth, DEFAULT_MAX_DEPTH);
  const maxVisited = assertCount(options.maxVisited ?? DEFAULT_MAX_VISITED, {
    fieldName: "maxVisited",
    min: 1
  });
  const direction = normalizeDirection(options.direction);
  const targetAccount = options.targetAccount ?? null;
  const stopPredicate =
    typeof options.stopPredicate === "function" ? options.stopPredicate : null;

  if (!graph.hasAccount(sourceAccount)) {
    return emptyResult(sourceAccount, startedAt);
  }

  const visited = new Set([sourceAccount]);
  const parentByAccount = new Map([[sourceAccount, undefined]]);
  const depthByAccount = new Map([[sourceAccount, 0]]);
  const visitOrder = [sourceAccount];
  const queue = [{ accountId: sourceAccount, depth: 0 }];

  let head = 0;
  let found = false;
  let foundAccount = null;
  let transactionsChecked = 0;
  let maxQueueSize = queue.length;
  let maxDepthReached = 0;
  let truncated = false;

  while (head < queue.length) {
    const current = queue[head];
    head += 1;

    if (current.depth > maxDepthReached) {
      maxDepthReached = current.depth;
    }

    const reachedTarget =
      targetAccount !== null && current.accountId === targetAccount;
    const matchedPredicate = stopPredicate
      ? Boolean(stopPredicate(current.accountId, current.depth))
      : false;

    if (reachedTarget || matchedPredicate) {
      found = true;
      foundAccount = current.accountId;
      break;
    }

    if (current.depth >= maxDepth) {
      continue;
    }

    const transactions =
      direction === "incoming"
        ? graph.getIncoming(current.accountId)
        : graph.getOutgoing(current.accountId);

    for (const transaction of transactions) {
      transactionsChecked += 1;
      const neighborAccountId = getNeighborAccountId(transaction, direction);

      if (visited.has(neighborAccountId)) {
        continue;
      }

      if (visited.size >= maxVisited) {
        truncated = true;
        break;
      }

      visited.add(neighborAccountId);
      parentByAccount.set(neighborAccountId, current.accountId);
      depthByAccount.set(neighborAccountId, current.depth + 1);
      visitOrder.push(neighborAccountId);
      queue.push({ accountId: neighborAccountId, depth: current.depth + 1 });

      if (queue.length - head > maxQueueSize) {
        maxQueueSize = queue.length - head;
      }
    }

    if (truncated) {
      break;
    }
  }

  const path = found
    ? buildPath(parentByAccount, sourceAccount, foundAccount)
    : [];
  const pathLength = path.length > 0 ? path.length - 1 : null;
  const reachedAccounts = visitOrder.slice(1);

  return {
    found,
    foundAccount,
    path,
    pathLength,
    visitedAccounts: visited.size,
    transactionsChecked,
    maxQueueSize,
    maxDepthReached,
    truncated,
    executionTimeMs: toRoundedMs(startedAt),
    reachedAccounts,
    depthByAccount: mapToNullProtoObject(depthByAccount),
    visitOrder,
    parentByAccount,
    sourceAccount
  };
}
