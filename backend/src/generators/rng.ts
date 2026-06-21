import seedrandom from "seedrandom";

export type RNG = ReturnType<typeof seedrandom>;

export function combineSeed(userSeed: string, page: number): string {
  try {
    const s = BigInt(userSeed);
    const p = BigInt(page + 1);
    // MAD: multiply-add with large constant
    const combined = s * p + BigInt(page) * 6364136223846793005n;
    return combined.toString();
  } catch {
    // Fallback if seed is not a valid BigInt
    return `${userSeed}-${page}`;
  }
}

export function makeRng(seed: string | number): RNG {
  return seedrandom(String(seed));
}

export function pick<T>(arr: T[], rng: RNG): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function randInt(min: number, max: number, rng: RNG): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function randFloat(min: number, max: number, rng: RNG): number {
  return min + rng() * (max - min);
}
