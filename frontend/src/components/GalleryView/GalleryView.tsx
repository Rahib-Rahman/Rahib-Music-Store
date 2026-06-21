import React, { useEffect, useRef } from "react";
import type { StoreParams } from "../../types/song";
import { useInfiniteSongs } from "../../hooks/useSongs";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import SongCard from "./SongCard";
import SongModal from "../SongModal";
import { useState } from "react";
import type { SongRecord } from "../../types/song";

interface GalleryViewProps {
  params: StoreParams;
}

export default function GalleryView({ params }: GalleryViewProps) {
  const { songs, loading, error, loadMore } = useInfiniteSongs(params);
  const { sentinelRef } = useInfiniteScroll(loadMore, loading);
  const [selected, setSelected] = useState<SongRecord | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll when params change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0 });
    }
  }, [params.locale, params.seed]);

  // Load initial batch
  useEffect(() => {
    if (songs.length === 0 && !loading) {
      loadMore();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.locale, params.seed, params.avgLikes]);

  return (
    <>
      <div ref={scrollRef} className="w-full">
        {error && (
          <div role="alert" className="text-center py-8 text-red-400 bg-red-900/20
                                       rounded-xl border border-red-800/40 mb-4">
            Failed to load songs: {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5
                        xl:grid-cols-6 gap-4">
          {songs.map(song => (
            <SongCard
              key={`${song.index}-${song.coverSeed}`}
              song={song}
              onClick={() => setSelected(song)}
            />
          ))}

          {/* Skeleton cards while loading */}
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`skel-${i}`} className="card animate-pulse">
                <div className="aspect-square bg-gray-800" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-700 rounded w-4/5" />
                  <div className="h-3 bg-gray-800 rounded w-3/5" />
                </div>
              </div>
            ))}
        </div>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-16 flex items-center justify-center mt-4">
          {loading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading more…
            </div>
          )}
        </div>
      </div>

      {/* Song detail modal */}
      {selected && (
        <SongModal song={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
