import { Faker, en, de, uk } from "@faker-js/faker";
import { makeRng, pick, combineSeed, RNG } from "./rng";

type LocaleKey = "en-US" | "de-DE" | "uk-UA";

const fakerInstances: Record<LocaleKey, Faker> = {
  "en-US": new Faker({ locale: [en] }),
  "de-DE": new Faker({ locale: [de, en] }),
  "uk-UA": new Faker({ locale: [uk, en] }),
};

// Locale-specific genre lists — loaded from config, not hardcoded in logic
import genres from "../locales/genres.json";
import adjectives from "../locales/adjectives.json";
import nouns from "../locales/nouns.json";

export interface SongRecord {
  index: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  likes: number;
  reviewText: string;
  coverSeed: string;
}

function generateArtist(faker: Faker, rng: RNG): string {
  const isBand = rng() < 0.45;
  if (isBand) {
    // band name patterns
    const patterns = [
      () => `The ${faker.word.adjective()} ${faker.word.noun()}s`,
      () => `${faker.word.adjective()} ${faker.word.noun()}`,
      () => `${faker.person.lastName()} & The ${faker.word.noun()}s`,
      () => faker.company.name().replace(/,.*/, ""),
    ];
    return pick(patterns, rng)();
  }
  return faker.person.fullName();
}

function generateTitle(
  locale: LocaleKey,
  rng: RNG
): string {
  const adjs = (adjectives as Record<LocaleKey, string[]>)[locale];
  const ns = (nouns as Record<LocaleKey, string[]>)[locale];
  const patterns = [
    () => `${pick(adjs, rng)} ${pick(ns, rng)}`,
    () => pick(ns, rng),
    () => `${pick(adjs, rng)} ${pick(adjs, rng)} ${pick(ns, rng)}`,
    () => `${pick(ns, rng)} of ${pick(adjs, rng)} ${pick(ns, rng)}`,
  ];
  return pick(patterns, rng)();
}

function generateAlbum(
  locale: LocaleKey,
  rng: RNG,
  faker: Faker
): string {
  if (rng() < 0.25) return "Single";
  const adjs = (adjectives as Record<LocaleKey, string[]>)[locale];
  const ns = (nouns as Record<LocaleKey, string[]>)[locale];
  const patterns = [
    () => `${pick(adjs, rng)} ${pick(ns, rng)}`,
    () => faker.word.words({ count: { min: 1, max: 3 } }),
    () => pick(ns, rng),
  ];
  return pick(patterns, rng)();
}

export function generatePage(
  locale: LocaleKey,
  userSeed: string,
  page: number,
  pageSize: number,
  avgLikes: number
): SongRecord[] {
  const faker = fakerInstances[locale];
  const pageSeed = combineSeed(userSeed, page);
  const contentRng = makeRng(pageSeed);
  // Separate RNG for likes — seeded from contentRng so it's independent per record
  const likesRng = makeRng(`likes-${pageSeed}-${avgLikes}`);

  const records: SongRecord[] = [];
  const startIndex = page * pageSize + 1;

  for (let i = 0; i < pageSize; i++) {
    // Seed each record's content RNG independently
    const recordSeed = `${pageSeed}-record-${i}`;
    const rRng = makeRng(recordSeed);

    const title = generateTitle(locale, rRng);
    const artist = generateArtist(faker, rRng);
    const album = generateAlbum(locale, rRng, faker);
    const genre = pick((genres as Record<LocaleKey, string[]>)[locale], rRng);

    // Likes: use p.lebedev's fractional approach
    const lRng = makeRng(`${pageSeed}-likes-${i}`);
    const addLike = (n: number) => n + 1;
    const likeFn = timesLikes(avgLikes, addLike, lRng);
    const likes = likeFn(0);

    // Review text — separate seed so it doesn't affect core fields
    const reviewRng = makeRng(`${pageSeed}-review-${i}`);
    faker.seed(reviewRng() * 2 ** 32);
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

// Inline fractional times specifically for likes (returns number)
function timesLikes(
  n: number,
  fn: (x: number) => number,
  rng: RNG
): (x: number) => number {
  if (n < 0) throw new Error("n must be non-negative");
  return (arg: number) => {
    for (let i = Math.floor(n); i-- > 0; ) arg = fn(arg);
    return rng() < n % 1 ? fn(arg) : arg;
  };
}
