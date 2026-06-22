import { fakerEN_US, fakerDE, fakerUK } from "@faker-js/faker";
import type { Faker } from "@faker-js/faker";
import { makeRng, pick, combineSeed } from "./rng";
import type { Locale } from "../types";

import genres     from "../locales/genres.json";
import adjectives from "../locales/adjectives.json";
import nouns      from "../locales/nouns.json";

// ── Faker instances per locale ────────────────────────────────────────────────
const fakerInstances: Record<Locale, Faker> = {
  "en-US": fakerEN_US,
  "de-DE": fakerDE,
  "uk-UA": fakerUK,
};

export interface SongRecord {
  index:      number;
  title:      string;
  artist:     string;
  album:      string;
  genre:      string;
  likes:      number;
  reviewText: string;
  coverSeed:  string;
}

type RNG = ReturnType<typeof makeRng>;

// ── Generators ────────────────────────────────────────────────────────────────

function generateArtist(faker: Faker, rng: RNG): string {
  const isBand = rng() < 0.45;
  if (isBand) {
    const patterns: Array<() => string> = [
      () => `The ${faker.word.adjective()} ${faker.word.noun()}s`,
      () => `${faker.word.adjective()} ${faker.word.noun()}`,
      () => `${faker.person.lastName()} & The ${faker.word.noun()}s`,
      () => faker.company.name().replace(/,.*/, ""),
    ];
    return pick(patterns, rng)();
  }
  return faker.person.fullName();
}

function generateTitle(locale: Locale, rng: RNG): string {
  const adjs = (adjectives as Record<Locale, string[]>)[locale];
  const ns   = (nouns      as Record<Locale, string[]>)[locale];
  const patterns: Array<() => string> = [
    () => `${pick(adjs, rng)} ${pick(ns, rng)}`,
    () => pick(ns, rng),
    () => `${pick(adjs, rng)} ${pick(adjs, rng)} ${pick(ns, rng)}`,
    () => `${pick(ns, rng)} of ${pick(adjs, rng)} ${pick(ns, rng)}`,
  ];
  return pick(patterns, rng)();
}

function generateAlbum(locale: Locale, rng: RNG, faker: Faker): string {
  if (rng() < 0.25) return "Single";
  const adjs = (adjectives as Record<Locale, string[]>)[locale];
  const ns   = (nouns      as Record<Locale, string[]>)[locale];
  const patterns: Array<() => string> = [
    () => `${pick(adjs, rng)} ${pick(ns, rng)}`,
    () => faker.word.words({ count: { min: 1, max: 3 } }),
    () => pick(ns, rng),
  ];
  return pick(patterns, rng)();
}

// ── p.lebedev fractional times ────────────────────────────────────────────────
// Calls fn exactly floor(n) times, then one more time with probability (n % 1)
function timesLikes(
    n: number,
    fn: (x: number) => number,
    rng: RNG
): (x: number) => number {
  if (n < 0) throw new Error("n must be non-negative");
  return (arg: number) => {
    for (let i = Math.floor(n); i-- > 0;) arg = fn(arg);
    return rng() < n % 1 ? fn(arg) : arg;
  };
}

// ── Main page generator ───────────────────────────────────────────────────────
export function generatePage(
    locale: Locale,
    userSeed: string,
    page: number,
    pageSize: number,
    avgLikes: number
): SongRecord[] {
  const faker      = fakerInstances[locale];
  const pageSeed   = combineSeed(userSeed, page);
  const start

