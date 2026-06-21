export type Locale = "en-US" | "de-DE" | "uk-UA";

export interface SongRecord {
  index: number;
  title: string;
  artist: string;
  album: string;
  genre: string;
  likes: number;
  reviewText: string;
  coverSeed: string;
}

export interface PageResponse {
  songs: SongRecord[];
  page: number;
  pageSize: number;
  locale: Locale;
}
