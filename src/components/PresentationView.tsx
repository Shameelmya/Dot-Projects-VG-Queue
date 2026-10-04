import React, { useEffect, useState, useRef } from 'react';
import type { PlaylistItem } from '../types';
import { channel, SyncMessage } from '../lib/sync';

interface Props {
  playlist: PlaylistItem[];
  currentIndex: number;
}

export const PresentationView: React.FC<Props> = ({ playlist, currentIndex }) => {
  const [urls, setUrls] = useState<string[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Initialize Object URLs
  useEffect(() => {
    const objectUrls = playlist.map(item => URL.createObjectURL(item.blob));
    setUrls(objectUrls);
    
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [playlist]);

  // Hide cursor logic
  const [hideCursor, setHideCursor] = useState(false);
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const resetCursor = () => {
      setHideCursor(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setHideCursor(true), 3000);
    };

    window.addEventListener('mousemove', resetCursor);
    resetCursor();

    return () => {
      window.removeEventListener('mousemove', resetCursor);
      clearTimeout(timeout);
    };
  }, []);

  // Play/pause videos programmatically based on active slide
  useEffect(() => {
    videoRefs.current.forEach((vid, i) => {
      if (vid) {
        if (i === currentIndex) {
          vid.currentTime = 0; // start from beginning
          vid.play().catch(e => console.error("Autoplay prevented:", e));
        } else {
          vid.pause();
        }
      }
    });
  }, [currentIndex]);

  if (playlist.length === 0 || urls.length !== playlist.length) {
    return (
      <div className="presenter-container" style={{ background: '#000' }}>
        <div className="loading">Loading Presentation...</div>
      </div>
    );
  }

  return (
    <div className={`presenter-container ${hideCursor ? 'hide-cursor' : ''}`}>
      <div className="screen-wrapper">
        {urls.map((url, idx) => (
          <div 
            key={idx} 
            className={`slide ${idx === currentIndex ? 'active' : ''}`}
          >
            {playlist[idx].type.startsWith('video/') ? (
              <video 
                ref={el => { videoRefs.current[idx] = el; }}
                src={url} 
                autoPlay 
                muted 
                playsInline
                preload="auto"
                onEnded={() => {
                  channel.postMessage({ type: 'VIDEO_ENDED', index: idx } as SyncMessage);
                }}
                style={{ width: '100%', height: '100%', objectFit: 'contain', outline: 'none', pointerEvents: 'none' }}
              />
            ) : (
              <img src={url} alt={`Slide ${idx + 1}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
