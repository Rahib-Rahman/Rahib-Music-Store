import React from "react";
import type { ViewMode } from "../types/song";
import clsx from "clsx";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}

export default function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="flex bg-gray-800 rounded-lg p-1 gap-1"
    >
      <button
        role="tab"
        aria-selected={mode === "table"}
        onClick={() => onChange("table")}
        className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
          mode === "table"
            ? "bg-brand-600 text-white shadow-lg shadow-brand-900/50"
            : "text-gray-400 hover:text-gray-200"
        )}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 10h18M3 6h18M3 14h18M3 18h18" />
        </svg>
        Table
      </button>
      <button
        role="tab"
        aria-selected={mode === "gallery"}
        onClick={() => onChange("gallery")}
        className={clsx(
          "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
          mode === "gallery"
            ? "bg-brand-600 text-white shadow-lg shadow-brand-900/50"
            : "text-gray-400 hover:text-gray-200"
        )}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        Gallery
      </button>
    </div>
  );
}
