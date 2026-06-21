import { useState, useCallback } from "react";
import type { StoreParams, Locale } from "../types/song";

function randomSeed(): string {
  // 64-bit seed as a large integer string
  const hi = Math.floor(Math.random() * 0xffffffff);
  const lo = Math.floor(Math.random() * 0xffffffff);
  return (BigInt(hi) * BigInt(0x100000000) + BigInt(lo)).toString();
}

const DEFAULT_PARAMS: StoreParams = {
  locale: "en-US",
  seed: "42",
  avgLikes: 3,
};

export function useStoreParams() {
  const [params, setParams] = useState<StoreParams>(DEFAULT_PARAMS);

  const setLocale = useCallback((locale: Locale) => {
    setParams(p => ({ ...p, locale }));
  }, []);

  const setSeed = useCallback((seed: string) => {
    setParams(p => ({ ...p, seed }));
  }, []);

  const setAvgLikes = useCallback((avgLikes: number) => {
    setParams(p => ({ ...p, avgLikes }));
  }, []);

  const randomizeSeed = useCallback(() => {
    setParams(p => ({ ...p, seed: randomSeed() }));
  }, []);

  return { params, setLocale, setSeed, setAvgLikes, randomizeSeed };
}
