import React from "react";
import type { SongRecord } from "../../types/song";
import CoverImage from "../CoverImage";
import AudioPlayer from "../AudioPlayer";

interface ExpandedPanelProps {
  song: SongRecord;
}

export default function ExpandedPanel({ song }: ExpandedPanelProps) {
  return (
    <div className="bg-gray-900/80 border-t border-gray-700/50 px-6 py-5
                    animate-[fadeSlideDown_0.2s_ease-out]">
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Cover image */}
        <div className="flex-shrink-0">
          <CoverImage
            coverSeed={song.coverSeed}
            title={song.title}
            artist={song.artist}
            size={200}
            className="rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
          />
        </div>

        {/* Right side */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Song meta */}
          <div>
            <h3 className="text-lg font-bold text-white leading-snug">
              {song.title}
            </h3>
            <p className="text-brand-400 font-medium mt-0.5">{song.artist}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {song.album === "Single" ? (
                <span className="bg-brand-900/60 text-brand-300 border
                                 border-brand-700/50 text-xs px-2 py-0.5 rounded-full">
                  Single
                </span>
              ) : (
                <span className="text-gray-400 text-sm">
                  Album:{" "}
                  <span className="text-gray-200">{song.album}</span>
                </span>
              )}
              <span className="bg-gray-800 border border-gray-700 text-gray-400
                               text-xs px-2 py-0.5 rounded-full">
                {song.genre}
              </span>
              {song.likes > 0 && (
                <span className="flex items-center gap-1 text-red-400 text-sm">
                  <span aria-hidden="true">❤</span>
                  {song.likes}{" "}
                  <span className="text-gray-600 text-xs">
                    {song.likes === 1 ? "like" : "likes"}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Audio player */}
          <AudioPlayer coverSeed={song.coverSeed} title={song.title} />

          {/* Review text */}
          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
            <p className="text-xs font-semibold text-gray-500 uppercase
                          tracking-wide mb-2">
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

