function hashSeed(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return Math.floor(seed) >>> 0;
  }

  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// mulberry32 - kompaktowy PRNG o dobrym rozkładzie, wystarczający dla danych syntetycznych.
function mulberry32(state) {
  let current = state;

  return function next() {
    current = (current + 0x6d2b79f5) >>> 0;
    let t = current;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRandom(seed) {
  if (typeof seed === "function") {
    return seed;
  }

  if (seed === undefined || seed === null) {
    return Math.random;
  }

  return mulberry32(hashSeed(seed));
}

export function resolveRandom(options = {}) {
  return createRandom(options.random ?? options.seed);
}

export function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}
