import React, { useState, useRef, useEffect, useCallback } from "react";

interface AudioPlayerProps {
  coverSeed: string;
  title: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function AudioPlayer({ coverSeed, title }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const src = `${API_BASE}/api/music?seed=${encodeURIComponent(coverSeed)}`;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    audio.addEventListener("loadstart", () => setLoading(true));
    audio.addEventListener("canplay", () => setLoading(false));
    audio.addEventListener("ended", () => { setPlaying(false); setProgress(0); });
    audio.addEventListener("error", () => { setError(true); setLoading(false); });
    audio.addEventListener("timeupdate", () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    });
    audio.addEventListener("durationchange", () => setDuration(audio.duration));

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src) {
      audio.src = src;
      audio.load();
    }
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setError(true));
    }
  }, [playing, src]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const val = parseFloat(e.target.value);
    audio.currentTime = val * audio.duration;
    setProgress(val);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-4 py-3 border border-gray-700">
      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        disabled={error}
        aria-label={playing ? `Pause ${title}` : `Play ${title}`}
        className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-500 disabled:opacity-40
                   flex items-center justify-center transition-all duration-200 flex-shrink-0
                   focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-lg shadow-brand-900/50"
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : playing ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 5v14l11-7L8 5z" />
          </svg>
        )}
      </button>

      {/* Progress */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={progress}
          onChange={handleSeek}
          aria-label="Playback progress"
          className="w-full h-1.5 bg-gray-600 rounded-full appearance-none cursor-pointer accent-brand-500"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(progress * duration)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {error && (
        <span className="text-xs text-red-400 flex-shrink-0">Unavailable</span>
      )}
    </div>
  );
}
