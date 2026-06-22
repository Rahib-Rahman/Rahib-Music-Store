import seedrandom from "seedrandom";

export type RNG = ReturnType<typeof seedrandom>;

export function combineSeed(userSeed: string, page: number): string {
  return `${userSeed}-page-${page}`;
}

export function makeRng(seed: string | number): RNG {
  return seedrandom(String(seed));
}

export function pick<T>(arr: T[], rng: RNG): T {
  if (arr.length === 0) throw new Error("Cannot pick from empty array");
  return arr[Math.floor(rng() * arr.length)];
}

export function randInt(min: number, max: number, rng: RNG): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function randFloat(min: number, max: number, rng: RNG): number {
  return min + rng() * (max - min);
}
