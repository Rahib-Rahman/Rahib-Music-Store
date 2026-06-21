import React from "react";
import type { SongRecord } from "../../types/song";
import CoverImage from "../CoverImage";
import clsx from "clsx";

interface SongCardProps {
  song: SongRecord;
  onClick: () => void;
}

export default function SongCard({ song, onClick }: SongCardProps) {
  return (
    <article
      onClick={onClick}
      className={clsx(
        "card group cursor-pointer hover:border-brand-700/60",
        "hover:shadow-xl hover:shadow-brand-900/30 hover:-translate-y-1",
        "transition-all duration-300"
      )}
      aria-label={`${song.title} by ${song.artist}`}
    >
      {/* Cover */}
      <div className="relative overflow-hidden aspect-square bg-gray-800">
        <CoverImage
          coverSeed={song.coverSeed}
          title={song.title}
          artist={song.artist}
          size={300}
          className="w-full h-full object-cover transition-transform duration-500
                     group-hover:scale-105"
        />

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                        transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-brand-600/90 flex items-center justify-center
                          shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <svg className="w-6 h-6 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          </div>
        </div>

        {/* Index badge */}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white
                        text-xs font-mono px-2 py-1 rounded-md">
          #{song.index}
        </div>

        {/* Likes badge */}
        {song.likes > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-red-400
                          text-xs px-2 py-1 rounded-md flex items-center gap-1">
            <span aria-hidden="true">❤</span>
            <span>{song.likes}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-white truncate leading-snug"
            title={song.title}>
          {song.title}
        </h3>
        <p className="text-xs text-brand-400 truncate mt-0.5" title={song.artist}>
          {song.artist}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 truncate max-w-[70%]"
                title={song.album}>
            {song.album}
          </span>
          <span className="text-xs bg-gray-800 border border-gray-700 text-gray-400
                           px-2 py-0.5 rounded-full flex-shrink-0">
            {song.genre}
          </span>
        </div>
      </div>
    </article>
  );
}
