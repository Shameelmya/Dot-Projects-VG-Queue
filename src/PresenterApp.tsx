import { useState, useEffect } from 'react';
import { PresentationView } from './components/PresentationView';
import type { PlaylistItem } from './types';
import { loadPlaylist } from './lib/db';
import { channel, type SyncMessage } from './lib/sync';

export function PresenterApp() {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [started, setStarted] = useState(false);

  const fetchPlaylist = () => {
    loadPlaylist().then(saved => {
      if (saved) setPlaylist(saved);
      setIsLoaded(true);
    });
  };

  useEffect(() => {
    fetchPlaylist();

    const handleMsg = (e: MessageEvent<SyncMessage>) => {
      const msg = e.data;
      if (msg.type === 'PLAYLIST_UPDATED') {
        fetchPlaylist();
      } else if (msg.type === 'STATE_SYNC') {
        setCurrentIndex(msg.currentIndex);
        // Note: isPaused handling could be passed down if needed
      } else if (msg.type === 'CLOSE_PRESENTER') {
        window.close();
      }
    };
    channel.addEventListener('message', handleMsg);
    return () => channel.removeEventListener('message', handleMsg);
  }, []);

  if (!started) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#fff', alignItems: 'center', justifyContent: 'center' }}>
        <h2 style={{ marginBottom: '24px' }}>Presentation Ready</h2>
        <button 
          className="btn btn-primary"
          style={{ padding: '16px 32px', fontSize: '1.2rem', cursor: 'pointer' }}
          onClick={() => {
            document.documentElement.requestFullscreen().catch(err => console.error(err));
            setStarted(true);
          }}
        >
          Click Here to Enter Fullscreen
        </button>
      </div>
    );
  }

  if (!isLoaded || playlist.length === 0) {
    return <div className="loading" style={{ background: '#000', color: '#fff' }}>Waiting for playlist...</div>;
  }

  return (
    <div className="app-container">
      <PresentationView 
        playlist={playlist} 
        currentIndex={currentIndex}
      />
    </div>
  );
}
