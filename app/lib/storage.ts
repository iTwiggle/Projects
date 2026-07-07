import type { AlbumContext, SavedIdea } from "@/app/types";
import { DEFAULT_ALBUM_CONTEXT } from "@/app/types";

const STORAGE_KEYS = {
  albumContext: "rap-lab:album-context",
  savedIdeas: "rap-lab:saved-ideas",
} as const;

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

export function loadAlbumContext(): AlbumContext {
  if (!hasWindow()) {
    return DEFAULT_ALBUM_CONTEXT;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.albumContext);
    if (!raw) {
      return DEFAULT_ALBUM_CONTEXT;
    }
    const parsed = JSON.parse(raw) as Partial<AlbumContext>;
    return {
      ...DEFAULT_ALBUM_CONTEXT,
      ...parsed,
    };
  } catch {
    return DEFAULT_ALBUM_CONTEXT;
  }
}

export function saveAlbumContext(context: AlbumContext): void {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.albumContext, JSON.stringify(context));
}

export function loadSavedIdeas(): SavedIdea[] {
  if (!hasWindow()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.savedIdeas);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as SavedIdea[];
  } catch {
    return [];
  }
}

export function saveSavedIdeas(ideas: SavedIdea[]): void {
  if (!hasWindow()) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEYS.savedIdeas, JSON.stringify(ideas));
}
