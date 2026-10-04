import { useState, useEffect, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import type { PlaylistItem } from './types';
import { savePlaylist, loadPlaylist } from './lib/db';
import { channel, type SyncMessage } from './lib/sync';

export function ControllerApp() {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const returnIndexRef = useRef<number | null>(null);

  // Load initial
  useEffect(() => {
    loadPlaylist().then(saved => {
      if (saved && saved.length > 0) setPlaylist(saved);
      setIsLoaded(true);
    });
  }, []);

  // Save on change and notify presenter
  useEffect(() => {
    if (isLoaded) {
      savePlaylist(playlist).then(() => {
        channel.postMessage({ type: 'PLAYLIST_UPDATED' } as SyncMessage);
      });
    }
  }, [playlist, isLoaded]);

  // Sync state to presenter whenever it changes
  useEffect(() => {
    if (isPresenting) {
      channel.postMessage({ type: 'STATE_SYNC', currentIndex, isPaused } as SyncMessage);
    }
  }, [currentIndex, isPaused, isPresenting]);

  // Handle messages from presenter
  useEffect(() => {
    const handleMsg = (e: MessageEvent<SyncMessage>) => {
      const msg = e.data;
      if (msg.type === 'VIDEO_ENDED' && msg.index === currentIndex) {
        if (returnIndexRef.current !== null) {
          setCurrentIndex(returnIndexRef.current);
          returnIndexRef.current = null;
        } else {
          setCurrentIndex(prev => (prev + 1) % playlist.length);
        }
      }
    };
    channel.addEventListener('message', handleMsg);
    return () => channel.removeEventListener('message', handleMsg);
  }, [currentIndex, playlist.length]);

  // Keyboard controls for master
  useEffect(() => {
    if (!isPresenting) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        returnIndexRef.current = null;
        setCurrentIndex((prev) => (prev + 1) % playlist.length);
      } else if (e.key === 'ArrowLeft') {
        returnIndexRef.current = null;
        setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
      } else if (e.key.toLowerCase() === 'p') {
        setIsPaused(true);
      } else if (e.key.toLowerCase() === 'c') {
        setIsPaused(false);
      } else if (e.key.toLowerCase() === 'h') {
        const homeIndex = playlist.findIndex(item => item.isHome);
        if (homeIndex !== -1 && homeIndex !== currentIndex) {
          returnIndexRef.current = currentIndex;
          setCurrentIndex(homeIndex);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, playlist, currentIndex]);

  // Master timer loop
  useEffect(() => {
    if (!isPresenting || playlist.length === 0 || isPaused) return;

    const currentItem = playlist[currentIndex];
    
    // Videos use their natural duration via the onEnded event instead of a timer
    if (currentItem?.type.startsWith('video/')) return;

    const durationMs = (currentItem?.duration || 5) * 1000;

    const timer = setTimeout(() => {
      if (returnIndexRef.current !== null) {
        setCurrentIndex(returnIndexRef.current);
        returnIndexRef.current = null;
      } else {
        setCurrentIndex((prev) => (prev + 1) % playlist.length);
      }
    }, durationMs);

    return () => clearTimeout(timer);
  }, [currentIndex, playlist, isPaused, isPresenting]);

  if (!isLoaded) return <div className="loading">Initializing...</div>;

  const startPresentation = (idx = 0) => {
    setCurrentIndex(idx);
    setIsPresenting(true);
    window.open('?mode=presenter', 'presenterWindow', 'width=1280,height=720');
  };

  const closePresentation = () => {
    setIsPresenting(false);
    channel.postMessage({ type: 'CLOSE_PRESENTER' } as SyncMessage);
  };

  return (
    <div className="app-container">
      <ControlPanel 
        playlist={playlist} 
        setPlaylist={setPlaylist} 
        onStart={startPresentation}
        onClose={closePresentation}
        currentIndex={currentIndex}
        isPresenting={isPresenting}
      />
    </div>
  );
}
