import React, { useEffect, useState, useRef } from 'react';
import type { PlaylistItem } from '../types';

interface Props {
  playlist: PlaylistItem[];
  onExit: () => void;
}

export const PresentationView: React.FC<Props> = ({ playlist, onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [urls, setUrls] = useState<string[]>([]);

  // Initialize Object URLs
  useEffect(() => {
    const objectUrls = playlist.map(item => URL.createObjectURL(item.blob));
    setUrls(objectUrls);
    
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [playlist]);

  // Request Fullscreen
  useEffect(() => {
    const elem = containerRef.current;
    if (elem) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onExit(); // user pressed ESC
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onExit]);

  const [isPaused, setIsPaused] = useState(false);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev + 1) % playlist.length);
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
      } else if (e.key.toLowerCase() === 'p') {
        setIsPaused(true);
      } else if (e.key.toLowerCase() === 'c') {
        setIsPaused(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playlist.length]);

  // Handle the loop
  useEffect(() => {
    if (playlist.length === 0 || isPaused) return;

    const currentItem = playlist[currentIndex];
    const durationMs = currentItem.duration * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [currentIndex, playlist, isPaused]);

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

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

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
    <div 
      ref={containerRef} 
      className={`presenter-container ${hideCursor ? 'hide-cursor' : ''}`}
    >
      <div className="screen-wrapper">
        {urls.map((url, idx) => (
          <div 
            key={idx} 
            className={`slide ${idx === currentIndex ? 'active' : ''}`}
          >
            {playlist[idx].type.startsWith('video/') ? (
              <video 
                ref={el => videoRefs.current[idx] = el}
                src={url} 
                autoPlay 
                muted 
                loop 
                playsInline
                preload="auto"
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
