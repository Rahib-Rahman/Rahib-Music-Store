import React, { useState } from "react";

interface CoverImageProps {
    coverSeed: string;
    title: string;
    artist: string;
    size?: number;
    className?: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export default function CoverImage({
                                       coverSeed,
                                       title,
                                       artist,
                                       size = 80,
                                       className = "",
                                   }: CoverImageProps) {
    const [errored, setErrored] = useState(false);

    const src = `${API_BASE}/api/cover?seed=${encodeURIComponent(coverSeed)}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;

    if (errored) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-800 text-gray-600 rounded-lg ${className}`}
                style={{ width: size, height: size }}
                aria-label={`Cover for ${title}`}
            >
                🎵
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={`Album cover for ${title} by ${artist}`}
            width={size}
            height={size}
            className={`object-cover rounded-lg ${className}`}
            onError={() => setErrored(true)}
            loading="lazy"
        />
    );
}
