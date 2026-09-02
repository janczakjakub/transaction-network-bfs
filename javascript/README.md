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

### 3) Uruchomienie testów / Run tests

```bash
npm test
```

Testy wykorzystują wbudowany runner Node (`node --test`).

### 4) Uruchomienie benchmarku / Run benchmark

```bash
npm run benchmark
```

Domyślnie mierzone są scenariusze 1k/10k i 10k/100k dla głębokości 1-5. Pełny zestaw (włącznie ze scenariuszem 100k kont / 1M transakcji) uruchamia `SCENARIOS=full npm run benchmark`.

## Złożoność BFS / BFS complexity

### Czas / Time: `O(V + E)`

Każde konto trafia do kolejki najwyżej raz, ponieważ `visited` jest oznaczany w momencie
dodania do kolejki, a nie przy zdejmowaniu. Każda transakcja jest sprawdzana najwyżej raz
w danym kierunku. Zdjęcie z kolejki jest amortyzowanym `O(1)` dzięki indeksowi `head`
zamiast `Array.prototype.shift()`, które kopiuje całą tablicę i podniosłoby koszt do `O(V^2)`.

### Pamięć / Memory: `O(V)`

Zbiór `visited`, mapy `parent` i `depth` oraz kolejka rosną liniowo z liczbą osiągniętych kont.

### Wpływ `maxDepth` / Impact of `maxDepth`

`maxDepth` ogranicza przeszukiwanie do kuli o promieniu `maxDepth` wokół konta źródłowego,
więc praktyczny koszt to `O(V_d + E_d)`, gdzie `V_d` i `E_d` to konta i transakcje w zasięgu.
W rzadkim grafie o średnim stopniu wychodzącym `b` liczba odwiedzonych kont rośnie
w przybliżeniu jak `b^maxDepth`, aż do nasycenia rozmiarem całej sieci. Pomiar dla sieci
10k kont / 100k transakcji (`npm run benchmark`):

| maxDepth | odwiedzone konta | sprawdzone transakcje |
| --- | --- | --- |
| 1 | ~10 | ~9 |
| 2 | ~118 | ~118 |
| 3 | ~1 049 | ~1 118 |
| 4 | ~6 757 | ~11 829 |
| 5 | ~9 974 | ~60 116 |

Brak jawnego `maxDepth` nie oznacza nieskończoności - domyślny limit to `DEFAULT_MAX_DEPTH = 10`.
Dodatkowym bezpiecznikiem jest `maxVisited` (domyślnie 1 000 000); po jego przekroczeniu wynik
zawiera `truncated: true`.

## Kwoty / Amounts

Źródłem prawdy jest `amountMinor` - liczba całkowita w groszach, walidowana przez
`Number.isSafeInteger`. Pole `amount` (w złotówkach) jest wartością pochodną, wygodną
do wyświetlania. Porównania proporcji w detektorach używają mnożenia krzyżowego na `BigInt`,
dzięki czemu wynik nie zależy od błędów zaokrągleń IEEE-754.

## Determinizm / Determinism

Generatory i benchmark przyjmują `seed` (albo własną funkcję `random`). Ten sam seed razem
z `startTimestamp` daje identyczną sieć, co czyni testy i pomiary powtarzalnymi:

```js
generateTransactionNetwork({ accounts: 200, transactions: 800, seed: "demo", startTimestamp: 0 });
```

Bez podanego seeda generatory korzystają z `Math.random()`.

## Limity wejścia / Input limits

Rozmiar generowanej sieci jest walidowany, żeby wartość z niezaufanego źródła nie doprowadziła
do wyczerpania pamięci: `MAX_ACCOUNTS = 1 000 000`, `MAX_TRANSACTIONS = 5 000 000`.
Przekroczenie limitu kończy się `RangeError`.

## Konfiguracja uruchomienia CLI / CLI runtime configuration

Możesz nadpisać domyślne parametry przez zmienne środowiskowe:
- `ACCOUNTS` (domyślnie `10000`, maksymalnie `1000000`),
- `TRANSACTIONS` (domyślnie `100000`, maksymalnie `5000000`),
- `MAX_DEPTH` (domyślnie `3`, maksymalnie `20`),
- `SEED` (opcjonalny, dla powtarzalnego wyniku).

Przykład:

```bash
ACCOUNTS=5000 TRANSACTIONS=50000 MAX_DEPTH=4 SEED=demo npm start
```

Wartości spoza zakresu są odrzucane z czytelnym komunikatem zamiast prowadzić do awarii procesu.

## Struktura (skrót) / Structure (short)

- `src/graph` - model grafu (`TransactionGraph`) i obsługa oznaczeń kont
- `src/algorithms` - BFS i funkcje oparte o BFS
- `src/analysis` - agregacja analizy konta
- `src/detection` - detektory sygnałów
- `src/risk` - obliczanie risk score i poziomu ryzyka
- `src/money` - arytmetyka kwot w jednostkach minor
- `src/generators` - generator danych syntetycznych i limity wejścia
- `src/benchmark` - moduły benchmarkowe (`npm run benchmark`)
- `src/utils` - PRNG z seedem i formatowanie identyfikatorów
- `src/validation` - wspólne asercje wejścia publicznego API
- `tests` - testy deterministyczne
