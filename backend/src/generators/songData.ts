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

// ── Fractional times ────────────────────────────────────────────────
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
  const startIndex = page * pageSize + 1;
  const records: SongRecord[] = [];

  for (let i = 0; i < pageSize; i++) {
    // ── Core content — only depends on seed + index, never on avgLikes ────────
    const recordSeed = `${pageSeed}-record-${i}`;
    const rRng = makeRng(recordSeed);

    const title  = generateTitle(locale, rRng);
    const artist = generateArtist(faker, rRng);
    const album  = generateAlbum(locale, rRng, faker);
    const genre  = pick(
        (genres as Record<Locale, string[]>)[locale],
        rRng
    );

    // ── Likes — independent RNG so changing avgLikes never affects titles ─────
    const lRng  = makeRng(`${pageSeed}-likes-${i}`);
    const likes = timesLikes(avgLikes, x => x + 1, lRng)(0);

    // ── Review — independent RNG seeded separately ────────────────────────────
    const revRng = makeRng(`${pageSeed}-review-${i}`);
    faker.seed(Math.floor(revRng() * 2 ** 31));
    const reviewText = faker.lorem.sentences({ min: 2, max: 4 });

    records.push({
      index: startIndex + i,
      title,
      artist,
      album,
      genre,
      likes,
      reviewText,
      coverSeed: `${userSeed}-${page}-${i}`,
    });
  }

  return records;
}

