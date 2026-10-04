import { get, set, clear } from 'idb-keyval';
import type { PlaylistItem } from '../types';

const PLAYLIST_KEY = 'event-playlist';

export async function savePlaylist(playlist: PlaylistItem[]) {
  await set(PLAYLIST_KEY, playlist);
}

export async function loadPlaylist(): Promise<PlaylistItem[]> {
  const data = await get<PlaylistItem[]>(PLAYLIST_KEY);
  return data || [];
}

export async function clearPlaylist() {
  await clear();
}
