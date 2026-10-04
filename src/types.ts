export interface PlaylistItem {
  id: string;
  blob: Blob;
  type: string;
  duration: number; // in seconds
  name: string;
}
