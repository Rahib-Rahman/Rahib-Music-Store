import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import type { SongRecord, StoreParams } from "../types/song";

const API_BASE = import.meta.env.VITE_API_URL ?? "https://rahib-music-store.onrender.com";
const PAGE_SIZE = 10;

// ── Table view: single page ──────────────────────────────────────────────────
export function useTableSongs(params: StoreParams, page: number) {
  const [songs, setSongs] = useState<SongRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    axios
      .get<{ songs: SongRecord[] }>(`${API_BASE}/api/songs`, {
        params: {
          locale: params.locale,
          seed: params.seed,
          avgLikes: params.avgLikes,
          page,
          pageSize: PAGE_SIZE,
        },
      })
      .then(res => {
        if (!cancelled) {
          setSongs(res.data.songs);
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [params.locale, params.seed, params.avgLikes, page]);

  return { songs, loading, error };
}

// ── Gallery view: infinite scroll ───────────────────────────────────────────
export function useInfiniteSongs(params: StoreParams) {
  const [songs, setSongs] = useState<SongRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);
  const exhaustedRef = useRef(false);

  // Reset when params change
  useEffect(() => {
    setSongs([]);
    pageRef.current = 0;
    exhaustedRef.current = false;
  }, [params.locale, params.seed, params.avgLikes]);

  const loadMore = useCallback(async () => {
    if (loading || exhaustedRef.current) return;
    setLoading(true);

    try {
      const res = await axios.get<{ songs: SongRecord[] }>(`${API_BASE}/api/songs`, {
        params: {
          locale: params.locale,
          seed: params.seed,
          avgLikes: params.avgLikes,
          page: pageRef.current,
          pageSize: PAGE_SIZE,
        },
      });
      const newSongs = res.data.songs;
      if (newSongs.length === 0) {
        exhaustedRef.current = true;
      } else {
        setSongs(prev => [...prev, ...newSongs]);
        pageRef.current += 1;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [params.locale, params.seed, params.avgLikes, loading]);

  return { songs, loading, error, loadMore };
}
