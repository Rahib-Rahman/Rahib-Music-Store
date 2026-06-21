import React, { useEffect, useCallback } from "react";
import type { SongRecord } from "../types/song";
import CoverImage from "./CoverImage";
import AudioPlayer from "./AudioPlayer";

interface SongModalProps {
  song: SongRecord;
  onClose: () => void;
}

export default function SongModal({ song, onClose }: SongModalProps) {
  // Close on Escape key
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${song.title}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 bg-gray-900 border border-gray-700 rounded-2xl
                      shadow-2xl w-full max-w-lg overflow-hidden
                      animate-[modalIn_0.2s_ease-out]">
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full
                     bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white
                     flex items-center justify-center transition-colors duration-150
                     focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Cover — full width top */}
        <div className="relative w-full aspect-square max-h-64 overflow-hidden bg-gray-800">
          <CoverImage
            coverSeed={song.coverSeed}
            title={song.title}
            artist={song.artist}
            size={500}
            className="w-full h-full object-cover"
          />
          {/* Gradient fade into panel */}
          <div className="absolute bottom-0 inset-x-0 h-20
                          bg-gradient-to-t from-gray-900 to-transparent" />
        </div>

        {/* Content */}
        <div className="px-6 pb-6 -mt-6 relative space-y-4">
          {/* Title + meta */}
          <div>
            <h2 className="text-xl font-bold text-white leading-snug">
              {song.title}
            </h2>
            <p className="text-brand-400 font-medium mt-0.5">{song.artist}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {song.album === "Single" ? (
                <span className="bg-brand-900/60 text-brand-300 border border-brand-700/50
                                 text-xs px-2 py-0.5 rounded-full">
                  Single
                </span>
              ) : (
                <span className="text-gray-400 text-sm">
                  {song.album}
                </span>
              )}
              <span className="bg-gray-800 border border-gray-700 text-gray-400
                               text-xs px-2 py-0.5 rounded-full">
                {song.genre}
              </span>
              {song.likes > 0 && (
                <span className="flex items-center gap-1 text-red-400 text-sm">
                  <span aria-hidden="true">❤</span>
                  {song.likes}
                </span>
              )}
            </div>
          </div>

          {/* Player */}
          <AudioPlayer coverSeed={song.coverSeed} title={song.title} />

          {/* Review */}
          <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Review
            </p>
            <p className="text-gray-300 text-sm leading-relaxed italic">
              "{song.reviewText}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
