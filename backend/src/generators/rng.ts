import seedrandom from "seedrandom";

export type RNG = ReturnType<typeof seedrandom>;

/** Combine user seed + page number into a single numeric seed (MAD) */
export function combineSeed(userSeed: string | number, page: number): string {
  const n = BigInt(userSeed) * BigInt(page + 1) + BigInt(page) * 6364136223846793005n;
  return n.toString();
}

export function makeRng(seed: string | number): RNG {
  return seedrandom(String(seed));
}

/**
 * p.lebedev's fractional times:
 * Calls fn exactly floor(n) times and one more time with probability (n % 1).
 */
export function times<T>(n: number, fn: (x: T) => T, rng: RNG): (x: T) => T {
  if (n < 0) throw new Error("n must be non-negative");
  return (arg: T) => {
    for (let i = Math.floor(n); i-- > 0; ) arg = fn(arg);
    return rng() < n % 1 ? fn(arg) : arg;
  };
}

/** Pick a random element from an array using seeded rng */
export function pick<T>(arr: T[], rng: RNG): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Random int in [min, max] inclusive */
export function randInt(min: number, max: number, rng: RNG): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Random float in [min, max] */
export function randFloat(min: number, max: number, rng: RNG): number {
  return min + rng() * (max - min);
}
