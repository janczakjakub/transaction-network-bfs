/**
 * Twarde limity wejścia generatora. Chronią przed alokacją struktur, które wywróciłyby
 * proces (OOM), gdy rozmiar sieci pochodzi z niezaufanego źródła - np. zmiennej środowiskowej.
 * Wartości mieszczą największy scenariusz benchmarku (100k kont / 1M transakcji).
 */
export const MAX_ACCOUNTS = 1_000_000;
export const MAX_TRANSACTIONS = 5_000_000;
export const MAX_SUSPICIOUS_PATTERNS = 100_000;
