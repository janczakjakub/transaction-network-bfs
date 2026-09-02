# transaction-network-bfs

## PL: Opis projektu

`transaction-network-bfs` to edukacyjny projekt w JavaScript, który pokazuje jak wykorzystać algorytm BFS (Breadth-First Search) do analizy sieci transakcji.

W projekcie:
- graf jest skierowany (`konto -> konto` przez transakcję),
- BFS jest głównym algorytmem (bez `Array.shift()` w kolejce) i nie modyfikuje grafu,
- logika BFS jest oddzielona od logiki risk score,
- dostępne są proste detektory sygnałów AML/fraud (wersja edukacyjna),
- kwoty są przechowywane jako liczby całkowite w groszach,
- jest generator syntetycznych danych z seedem i testy automatyczne.

Projekt nie jest produkcyjnym systemem AML i nie używa prawdziwych danych finansowych.

## EN: Project description

`transaction-network-bfs` is an educational JavaScript project that demonstrates how to use BFS (Breadth-First Search) for transaction network analysis.

In this project:
- the graph is directed (`account -> account` through transactions),
- BFS is the main algorithm (without `Array.shift()` in the queue) and never mutates the graph,
- BFS logic is separated from risk scoring logic,
- simple AML/fraud signal detectors are implemented (educational only),
- monetary amounts are stored as integers in minor units,
- seeded synthetic data generation and automated tests are included.

This is not a production AML system and does not use real financial data.

## Uruchomienie / Run

### Wymagania / Requirements

- Node.js `>= 20`

### 1) Wejście do katalogu / Enter project directory

```bash
cd javascript
```

### 2) Uruchomienie przykładu CLI / Run CLI example

```bash
npm start
```

Skrypt uruchamia `node src/index.js` i generuje raport analizy przykładowego konta.

The script runs `node src/index.js` and prints an analysis report for a sample account.

### 3) Uruchomienie testów / Run tests

```bash
npm test
```

Testy wykorzystują wbudowany runner Node (`node --test`).

Tests use the built-in Node test runner (`node --test`).

### 4) Uruchomienie benchmarku / Run benchmark

```bash
npm run benchmark
```

Domyślnie mierzone są scenariusze 1k/10k i 10k/100k dla głębokości 1-5. Pełny zestaw (włącznie ze scenariuszem 100k kont / 1M transakcji) uruchamia `SCENARIOS=full npm run benchmark`.

By default, scenarios 1k/10k and 10k/100k are measured for depths 1-5. The full suite (including 100k accounts / 1M transactions) runs with `SCENARIOS=full npm run benchmark`.

### Queue benchmark: head index vs Array.shift()

```bash
npm run benchmark:queue
```

Benchmark porównuje dwie strategie kolejki dla BFS na tym samym wygenerowanym grafie i tych samych parametrach przebiegu:
- `head` index (implementacja produkcyjna),
- `Array.shift()` (wariant edukacyjny wyłącznie do porównań).

The benchmark compares two queue strategies for BFS on the same generated graph and the same run parameters:
- `head` index (production implementation),
- `Array.shift()` (educational variant for comparison only).

Wynik ma charakter edukacyjny i zależy od wersji Node.js, silnika V8, sprzętu oraz charakterystyki grafu. Opcjonalny scenariusz large uruchamia `SCENARIOS=full npm run benchmark:queue`.

Results are educational and depend on the Node.js version, V8 engine, hardware, and graph characteristics. The optional large scenario runs with `SCENARIOS=full npm run benchmark:queue`.

## Złożoność BFS / BFS complexity

### Czas / Time: `O(V + E)`

Każde konto trafia do kolejki najwyżej raz, ponieważ `visited` jest oznaczany w momencie
dodania do kolejki, a nie przy zdejmowaniu. Każda transakcja jest sprawdzana najwyżej raz
w danym kierunku. Zdjęcie z kolejki jest amortyzowanym `O(1)` dzięki indeksowi `head`
zamiast `Array.prototype.shift()`, które usuwa pierwszy element tablicy i może wymagać
dodatkowej pracy związanej z reorganizacją elementów.

Each account enters the queue at most once, because `visited` is set when the account is
enqueued, not when it is dequeued. Each transaction is checked at most once in a given
direction. Dequeue is amortized `O(1)` thanks to the `head` index instead of
`Array.prototype.shift()`, which removes the first array element and may require extra work
to reorganize the remaining elements.

W praktycznych implementacjach kolejki dla BFS dlatego często używa się rosnącego indeksu
`head`. Różnicę dla tego projektu można sprawdzić benchmarkiem `npm run benchmark:queue`.

In practical BFS queue implementations, a growing `head` index is therefore often preferred.
You can measure the difference in this project with `npm run benchmark:queue`.

### Pamięć / Memory: `O(V)`

Zbiór `visited`, mapy `parent` i `depth` oraz kolejka rosną liniowo z liczbą osiągniętych kont.

The `visited` set, `parent` and `depth` maps, and the queue all grow linearly with the number
of reached accounts.

### Wpływ `maxDepth` / Impact of `maxDepth`

`maxDepth` ogranicza przeszukiwanie do kuli o promieniu `maxDepth` wokół konta źródłowego,
więc praktyczny koszt to `O(V_d + E_d)`, gdzie `V_d` i `E_d` to konta i transakcje w zasięgu.
W rzadkim grafie o średnim stopniu wychodzącym `b` liczba odwiedzonych kont rośnie
w przybliżeniu jak `b^maxDepth`, aż do nasycenia rozmiarem całej sieci. Pomiar dla sieci
10k kont / 100k transakcji (`npm run benchmark`):

`maxDepth` limits the search to a ball of radius `maxDepth` around the source account, so
the practical cost is `O(V_d + E_d)`, where `V_d` and `E_d` are the accounts and transactions
within reach. In a sparse graph with average out-degree `b`, the number of visited accounts
grows roughly like `b^maxDepth` until the search saturates the whole network. Sample
measurements for a 10k accounts / 100k transactions network (`npm run benchmark`):

| maxDepth | odwiedzone konta / visited accounts | sprawdzone transakcje / transactions checked |
| --- | --- | --- |
| 1 | ~10 | ~9 |
| 2 | ~118 | ~118 |
| 3 | ~1 049 | ~1 118 |
| 4 | ~6 757 | ~11 829 |
| 5 | ~9 974 | ~60 116 |

Brak jawnego `maxDepth` nie oznacza nieskończoności - domyślny limit to `DEFAULT_MAX_DEPTH = 10`.
Dodatkowym bezpiecznikiem jest `maxVisited` (domyślnie 1 000 000); po jego przekroczeniu wynik
zawiera `truncated: true`.

An explicit `maxDepth` is not unlimited - the default cap is `DEFAULT_MAX_DEPTH = 10`.
An additional safeguard is `maxVisited` (default 1 000 000); when exceeded, the result
includes `truncated: true`.

## Kwoty / Amounts

Źródłem prawdy jest `amountMinor` - liczba całkowita w groszach, walidowana przez
`Number.isSafeInteger`. Pole `amount` (w złotówkach) jest wartością pochodną, wygodną
do wyświetlania. Porównania proporcji w detektorach używają mnożenia krzyżowego na `BigInt`,
dzięki czemu wynik nie zależy od błędów zaokrągleń IEEE-754.

The source of truth is `amountMinor` - an integer in minor units, validated with
`Number.isSafeInteger`. The `amount` field (in major currency units) is a derived value for
display. Ratio comparisons in detectors use cross-multiplication on `BigInt`, so results do
not depend on IEEE-754 rounding errors.

## Determinizm / Determinism

Generatory i benchmark przyjmują `seed` (albo własną funkcję `random`). Ten sam seed razem
z `startTimestamp` daje identyczną sieć, co czyni testy i pomiary powtarzalnymi:

Generators and benchmarks accept a `seed` (or a custom `random` function). The same seed
together with `startTimestamp` produces an identical network, which makes tests and
measurements reproducible:

```js
generateTransactionNetwork({ accounts: 200, transactions: 800, seed: "demo", startTimestamp: 0 });
```

Bez podanego seeda generatory korzystają z `Math.random()`.

Without a seed, generators fall back to `Math.random()`.

## Limity wejścia / Input limits

Rozmiar generowanej sieci jest walidowany, żeby wartość z niezaufanego źródła nie doprowadziła
do wyczerpania pamięci: `MAX_ACCOUNTS = 1 000 000`, `MAX_TRANSACTIONS = 5 000 000`.
Przekroczenie limitu kończy się `RangeError`.

Generated network size is validated so untrusted input cannot exhaust memory:
`MAX_ACCOUNTS = 1 000 000`, `MAX_TRANSACTIONS = 5 000 000`. Exceeding a limit throws
`RangeError`.

## Konfiguracja uruchomienia CLI / CLI runtime configuration

Możesz nadpisać domyślne parametry przez zmienne środowiskowe:
- `ACCOUNTS` (domyślnie `10000`, maksymalnie `1000000`),
- `TRANSACTIONS` (domyślnie `100000`, maksymalnie `5000000`),
- `MAX_DEPTH` (domyślnie `3`, maksymalnie `20`),
- `SEED` (opcjonalny, dla powtarzalnego wyniku).

You can override default parameters with environment variables:
- `ACCOUNTS` (default `10000`, maximum `1000000`),
- `TRANSACTIONS` (default `100000`, maximum `5000000`),
- `MAX_DEPTH` (default `3`, maximum `20`),
- `SEED` (optional, for reproducible output).

Przykład / Example:

```bash
ACCOUNTS=5000 TRANSACTIONS=50000 MAX_DEPTH=4 SEED=demo npm start
```

Wartości spoza zakresu są odrzucane z czytelnym komunikatem zamiast prowadzić do awarii procesu.

Out-of-range values are rejected with a clear message instead of crashing the process.

## Struktura (skrót) / Structure (short)

- `src/graph` - model grafu (`TransactionGraph`) i obsługa oznaczeń kont / graph model (`TransactionGraph`) and account flag handling
- `src/algorithms` - BFS i funkcje oparte o BFS / BFS and BFS-based helpers
- `src/analysis` - agregacja analizy konta / account analysis aggregation
- `src/detection` - detektory sygnałów / signal detectors
- `src/risk` - obliczanie risk score i poziomu ryzyka / risk score and risk level calculation
- `src/money` - arytmetyka kwot w jednostkach minor / amount arithmetic in minor units
- `src/generators` - generator danych syntetycznych i limity wejścia / synthetic data generator and input limits
- `src/benchmark` - moduły benchmarkowe (`npm run benchmark`, `npm run benchmark:queue`) / benchmark modules
- `src/utils` - PRNG z seedem i formatowanie identyfikatorów / seeded PRNG and identifier formatting
- `src/validation` - wspólne asercje wejścia publicznego API / shared public API input assertions
- `tests` - testy deterministyczne / deterministic tests
