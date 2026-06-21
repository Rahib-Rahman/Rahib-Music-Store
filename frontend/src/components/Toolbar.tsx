import React, { useId } from "react";
import type { Locale, StoreParams } from "../types/song";

interface ToolbarProps {
  params: StoreParams;
  onLocaleChange: (l: Locale) => void;
  onSeedChange: (s: string) => void;
  onAvgLikesChange: (n: number) => void;
  onRandomizeSeed: () => void;
}

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en-US", label: "🇺🇸 English (USA)" },
  { value: "de-DE", label: "🇩🇪 German (Germany)" },
  { value: "uk-UA", label: "🇺🇦 Ukrainian (Ukraine)" },
];

export default function Toolbar({
  params,
  onLocaleChange,
  onSeedChange,
  onAvgLikesChange,
  onRandomizeSeed,
}: ToolbarProps) {
  const seedId = useId();
  const likesId = useId();
  const localeId = useId();

  return (
    <header className="sticky top-0 z-30 bg-gray-950/90 backdrop-blur border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* App name */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🎵</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-brand-400 to-purple-400 bg-clip-text text-transparent">
            Music Store
          </h1>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-end gap-4">
          {/* Language */}
          <div className="flex flex-col gap-1">
            <label htmlFor={localeId} className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Language
            </label>
            <select
              id={localeId}
              value={params.locale}
              onChange={e => onLocaleChange(e.target.value as Locale)}
              className="toolbar-input min-w-[180px] cursor-pointer"
            >
              {LOCALES.map(l => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Seed */}
          <div className="flex flex-col gap-1">
            <label htmlFor={seedId} className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Seed
            </label>
            <div className="flex gap-2">
              <input
                id={seedId}
                type="text"
                value={params.seed}
                onChange={e => {
                  // Allow only digits
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  onSeedChange(val || "0");
                }}
                className="toolbar-input w-44 font-mono"
                placeholder="Enter seed…"
                aria-label="Seed value"
              />
              <button
                onClick={onRandomizeSeed}
                className="btn-ghost border border-gray-700 hover:border-brand-500"
                title="Generate random seed"
                aria-label="Randomize seed"
              >
                🎲
              </button>
            </div>
          </div>

          {/* Likes */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label htmlFor={likesId} className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Avg Likes per Song:{" "}
              <span className="text-brand-400 font-semibold">{params.avgLikes.toFixed(1)}</span>
            </label>
            <input
              id={likesId}
              type="range"
              min={0}
              max={10}
              step={0.1}
              value={params.avgLikes}
              onChange={e => onAvgLikesChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                         accent-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Average likes per song"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
