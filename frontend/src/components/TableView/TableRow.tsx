import React, { useState } from "react";
import type { SongRecord } from "../../types/song";
import ExpandedPanel from "./ExpandedPanel";
import clsx from "clsx";

interface TableRowProps {
  song: SongRecord;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function TableRow({ song, isExpanded, onToggle }: TableRowProps) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={clsx(
          "cursor-pointer border-b border-gray-800/60 transition-colors duration-150",
          isExpanded
            ? "bg-gray-800/70"
            : "hover:bg-gray-800/40"
        )}
        aria-expanded={isExpanded}
        aria-label={`${song.title} by ${song.artist} — click to ${isExpanded ? "collapse" : "expand"}`}
      >
        {/* Index */}
        <td className="px-4 py-3 text-gray-500 font-mono text-sm w-12 text-right">
          {song.index}
        </td>

        {/* Expand indicator */}
        <td className="px-2 py-3 w-8">
          <span
            className={clsx(
              "inline-block text-gray-500 transition-transform duration-200",
              isExpanded ? "rotate-90" : "rotate-0"
            )}
            aria-hidden="true"
          >
            ▶
          </span>
        </td>

        {/* Title */}
        <td className="px-4 py-3 font-medium text-white max-w-[180px] truncate">
          {song.title}
        </td>

        {/* Artist */}
        <td className="px-4 py-3 text-brand-400 max-w-[160px] truncate">
          {song.artist}
        </td>

        {/* Album */}
        <td className="px-4 py-3 text-gray-300 max-w-[140px] truncate hidden md:table-cell">
          {song.album === "Single" ? (
            <span className="inline-flex items-center bg-brand-900/50 text-brand-300
                             border border-brand-700/40 text-xs px-2 py-0.5 rounded-full">
              Single
            </span>
          ) : (
            song.album
          )}
        </td>

        {/* Genre */}
        <td className="px-4 py-3 hidden lg:table-cell">
          <span className="bg-gray-800 border border-gray-700 text-gray-400
                           text-xs px-2 py-1 rounded-full">
            {song.genre}
          </span>
        </td>

        {/* Likes */}
        <td className="px-4 py-3 text-right">
          {song.likes > 0 ? (
            <span className="flex items-center justify-end gap-1 text-red-400 text-sm">
              <span aria-hidden="true">❤</span>
              <span>{song.likes}</span>
            </span>
          ) : (
            <span className="text-gray-700 text-sm">—</span>
          )}
        </td>
      </tr>

      {/* Expanded panel row */}
      {isExpanded && (
        <tr>
          <td colSpan={7} className="p-0">
            <ExpandedPanel song={song} />
          </td>
        </tr>
      )}
    </>
  );
}
