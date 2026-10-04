import { useState, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { PresentationView } from './components/PresentationView';
import type { PlaylistItem } from './types';
import { savePlaylist, loadPlaylist } from './lib/db';

function App() {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [isPresenting, setIsPresenting] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadPlaylist().then(saved => {
      if (saved && saved.length > 0) {
        setPlaylist(saved);
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      savePlaylist(playlist);
    }
  }, [playlist, isLoaded]);

  if (!isLoaded) {
    return <div className="loading">Initializing...</div>;
  }

  return (
    <div className="app-container">
      {isPresenting ? (
        <PresentationView 
          playlist={playlist} 
          startIndex={startIndex}
          onExit={() => setIsPresenting(false)} 
        />
      ) : (
        <ControlPanel 
          playlist={playlist} 
          setPlaylist={setPlaylist} 
          onStart={(idx = 0) => {
            setStartIndex(idx);
            setIsPresenting(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
