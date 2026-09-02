# transaction-network-bfs

## PL: Opis projektu

`transaction-network-bfs` to edukacyjny projekt w JavaScript, który pokazuje jak wykorzystać algorytm BFS (Breadth-First Search) do analizy sieci transakcji.

W projekcie:
- graf jest skierowany (`konto -> konto` przez transakcję),
- BFS jest głównym algorytmem (bez `Array.shift()` w kolejce),
- logika BFS jest oddzielona od logiki risk score,
- dostępne są proste detektory sygnałów AML/fraud (wersja edukacyjna),
- jest generator syntetycznych danych i testy automatyczne.

Projekt nie jest produkcyjnym systemem AML i nie używa prawdziwych danych finansowych.

## EN: Project description

`transaction-network-bfs` is an educational JavaScript project that demonstrates how to use BFS (Breadth-First Search) for transaction network analysis.

In this project:
- the graph is directed (`account -> account` through transactions),
- BFS is the main algorithm (without `Array.shift()` in the queue),
- BFS logic is separated from risk scoring logic,
- simple AML/fraud signal detectors are implemented (educational only),
- synthetic data generation and automated tests are included.

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

## Konfiguracja uruchomienia CLI / CLI runtime configuration

Możesz nadpisać domyślne parametry przez zmienne środowiskowe:
- `ACCOUNTS` (domyślnie `10000`),
- `TRANSACTIONS` (domyślnie `100000`),
- `MAX_DEPTH` (domyślnie `3`).

Przykład:

```bash
ACCOUNTS=5000 TRANSACTIONS=50000 MAX_DEPTH=4 npm start
```

## Struktura (skrót) / Structure (short)

- `src/graph` - model grafu (`TransactionGraph`)
- `src/algorithms` - BFS i funkcje oparte o BFS
- `src/analysis` - agregacja analizy konta
- `src/detection` - detektory sygnałów
- `src/risk` - obliczanie risk score i poziomu ryzyka
- `src/generators` - generator danych syntetycznych
- `src/benchmark` - moduły benchmarkowe
- `tests` - testy deterministyczne
