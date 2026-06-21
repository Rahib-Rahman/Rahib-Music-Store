import React, { useState } from "react";
import Toolbar from "./components/Toolbar";
import ViewToggle from "./components/ViewToggle";
import TableView from "./components/TableView/TableView";
import GalleryView from "./components/GalleryView/GalleryView";
import { useStoreParams } from "./hooks/useParams";
import type { ViewMode } from "./types/song";

export default function App() {
  const { params, setLocale, setSeed, setAvgLikes, randomizeSeed } = useStoreParams();
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Toolbar */}
      <Toolbar
        params={params}
        onLocaleChange={setLocale}
        onSeedChange={setSeed}
        onAvgLikesChange={setAvgLikes}
        onRandomizeSeed={randomizeSeed}
      />

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* View toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Showing results for{" "}
            <span className="text-brand-400 font-medium">{params.locale}</span>
            {" · "}seed{" "}
            <span className="font-mono text-gray-300">{params.seed}</span>
          </p>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>

        {/* Views */}
        {viewMode === "table" ? (
          <TableView params={params} />
        ) : (
          <GalleryView params={params} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        Music Store · All data is procedurally generated
      </footer>
    </div>
  );
}
