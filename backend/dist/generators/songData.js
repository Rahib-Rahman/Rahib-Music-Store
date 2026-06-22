"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePage = void 0;
const en_1 = require("@faker-js/faker/locale/en");
const de_1 = require("@faker-js/faker/locale/de");
const uk_1 = require("@faker-js/faker/locale/uk");
const rng_1 = require("./rng");
const genres_json_1 = __importDefault(require("../locales/genres.json"));
const adjectives_json_1 = __importDefault(require("../locales/adjectives.json"));
const nouns_json_1 = __importDefault(require("../locales/nouns.json"));
const fakerInstances = {
    "en-US": en_1.fakerEN,
    "de-DE": de_1.fakerDE,
    "uk-UA": uk_1.fakerUK,
};
function generateArtist(faker, rng) {
    const isBand = rng() < 0.45;
    if (isBand) {
        const patterns = [
            () => `The ${faker.word.adjective()} ${faker.word.noun()}s`,
            () => `${faker.word.adjective()} ${faker.word.noun()}`,
            () => `${faker.person.lastName()} & The ${faker.word.noun()}s`,
            () => faker.company.name().replace(/,.*/, ""),
        ];
        return (0, rng_1.pick)(patterns, rng)();
    }
    return faker.person.fullName();
}
function generateTitle(locale, rng) {
    const adjs = adjectives_json_1.default[locale];
    const ns = nouns_json_1.default[locale];
    const patterns = [
        () => `${(0, rng_1.pick)(adjs, rng)} ${(0, rng_1.pick)(ns, rng)}`,
        () => (0, rng_1.pick)(ns, rng),
        () => `${(0, rng_1.pick)(adjs, rng)} ${(0, rng_1.pick)(adjs, rng)} ${(0, rng_1.pick)(ns, rng)}`,
        () => `${(0, rng_1.pick)(ns, rng)} of ${(0, rng_1.pick)(adjs, rng)} ${(0, rng_1.pick)(ns, rng)}`,
    ];
    return (0, rng_1.pick)(patterns, rng)();
}
function generateAlbum(locale, rng, faker) {
    if (rng() < 0.25)
        return "Single";
    const adjs = adjectives_json_1.default[locale];
    const ns = nouns_json_1.default[locale];
    const patterns = [
        () => `${(0, rng_1.pick)(adjs, rng)} ${(0, rng_1.pick)(ns, rng)}`,
        () => faker.word.words({ count: { min: 1, max: 3 } }),
        () => (0, rng_1.pick)(ns, rng),
    ];
    return (0, rng_1.pick)(patterns, rng)();
}
function timesLikes(n, fn, rng) {
    if (n < 0)
        throw new Error("n must be non-negative");
    return (arg) => {
        for (let i = Math.floor(n); i-- > 0;)
            arg = fn(arg);
        return rng() < n % 1 ? fn(arg) : arg;
    };
}
function generatePage(locale, userSeed, page, pageSize, avgLikes) {
    const faker = fakerInstances[locale];
    const pageSeed = (0, rng_1.combineSeed)(userSeed, page);
    const records = [];
    const startIndex = page * pageSize + 1;
    for (let i = 0; i < pageSize; i++) {
        const recordSeed = `${pageSeed}-record-${i}`;
        const rRng = (0, rng_1.makeRng)(recordSeed);
        const title = generateTitle(locale, rRng);
        const artist = generateArtist(faker, rRng);
        const album = generateAlbum(locale, rRng, faker);
        const genre = (0, rng_1.pick)(genres_json_1.default[locale], rRng);
        const lRng = (0, rng_1.makeRng)(`${pageSeed}-likes-${i}`);
        const likeFn = timesLikes(avgLikes, x => x + 1, lRng);
        const likes = likeFn(0);
        const revRng = (0, rng_1.makeRng)(`${pageSeed}-review-${i}`);
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
exports.generatePage = generatePage;
