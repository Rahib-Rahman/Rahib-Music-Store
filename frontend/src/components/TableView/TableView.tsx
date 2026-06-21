import React, { useState, useEffect } from "react";
import type { StoreParams } from "../../types/song";
import { useTableSongs } from "../../hooks/useSongs";
import TableRow from "./TableRow";

interface TableViewProps {
  params: StoreParams;
}

export default function TableView({ params }: TableViewProps) {
  const [page, setPage] = useState(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const { songs, loading, error } = useTableSongs(params, page);

  // Reset to page 0 on locale or seed change
  useEffect(() => {
    setPage(0);
    setExpandedIndex(null);
  }, [params.locale, params.seed]);

  // Collapse expanded row when page changes
  useEffect(() => {
    setExpandedIndex(null);
  }, [page]);

  const toggleExpand = (index: number) => {
    setExpandedIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="w-full space-y-4">
      {error && (
        <div role="alert"
             className="text-center py-6 text-red-400 bg-red-900/20
                        rounded-xl border border-red-800/40">
          Failed to load songs: {error}
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table
          className="w-full text-sm"
          role="grid"
          aria-label="Music store songs"
          aria-busy={loading}
        >
          <thead>
            <tr className="border-b border-gray-700 bg-gray-900/80 text-left">
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold
                                         text-gray-500 uppercase tracking-wide w-12">
                #
              </th>
              <th scope="col" className="w-8" aria-hidden="true" />
              <th scope="col" className="px-4 py-3 text-xs font-semibold
                                         text-gray-500 uppercase tracking-wide">
                Title
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold
                                         text-gray-500 uppercase tracking-wide">
                Artist
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold
                                         text-gray-500 uppercase tracking-wide
                                         hidden md:table-cell">
                Album
              </th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold
                                         text-gray-500 uppercase tracking-wide
                                         hidden lg:table-cell">
                Genre
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold
                                         text-gray-500 uppercase tracking-wide">
                Likes
              </th>
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={`skel-${i}`}
                      className="border-b border-gray-800/60 animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-3 bg-gray-800 rounded w-6 ml-auto" />
                    </td>
                    <td />
                    <td className="px-4 py-4">
                      <div className="h-3 bg-gray-700 rounded w-36" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 bg-gray-800 rounded w-28" />
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="h-3 bg-gray-800 rounded w-24" />
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <div className="h-3 bg-gray-800 rounded w-16" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 bg-gray-800 rounded w-6 ml-auto" />
                    </td>
                  </tr>
                ))
              : songs.map(song => (
                  <TableRow
                    key={`${song.index}-${song.coverSeed}`}
                    song={song}
                    isExpanded={expandedIndex === song.index}
                    onToggle={() => toggleExpand(song.index)}
                  />
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-gray-500">
          Page <span className="text-gray-300 font-medium">{page + 1}</span>
          {" · "}
          Songs{" "}
          <span className="text-gray-300 font-medium">
            {page * 10 + 1}–{page * 10 + (songs.length || 10)}
          </span>
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="btn-primary disabled:opacity-40"
            aria-label="Previous page"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600 font-mono px-2">
            {page + 1}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={loading}
            className="btn-primary"
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
