"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.randFloat = exports.randInt = exports.pick = exports.makeRng = exports.combineSeed = void 0;
const seedrandom_1 = __importDefault(require("seedrandom"));
function combineSeed(userSeed, page) {
    try {
        const s = BigInt(userSeed);
        const p = BigInt(page + 1);
        // MAD: multiply-add with large constant
        const combined = s * p + BigInt(page) * 6364136223846793005n;
        return combined.toString();
    }
    catch {
        // Fallback if seed is not a valid BigInt
        return `${userSeed}-${page}`;
    }
}
exports.combineSeed = combineSeed;
function makeRng(seed) {
    return (0, seedrandom_1.default)(String(seed));
}
exports.makeRng = makeRng;
function pick(arr, rng) {
    return arr[Math.floor(rng() * arr.length)];
}
exports.pick = pick;
function randInt(min, max, rng) {
    return min + Math.floor(rng() * (max - min + 1));
}
exports.randInt = randInt;
function randFloat(min, max, rng) {
    return min + rng() * (max - min);
}
exports.randFloat = randFloat;
