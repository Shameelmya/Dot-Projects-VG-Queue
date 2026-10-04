export const channel = new BroadcastChannel('limitless_presenter_sync');

export type SyncMessage = 
  | { type: 'PLAYLIST_UPDATED' }
  | { type: 'STATE_SYNC', currentIndex: number, isPaused: boolean }
  | { type: 'VIDEO_ENDED', index: number }
  | { type: 'CLOSE_PRESENTER' };
