import React, { useRef, useState } from 'react';
import { UploadCloud, Play, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import type { PlaylistItem } from '../types';

interface Props {
  playlist: PlaylistItem[];
  setPlaylist: React.Dispatch<React.SetStateAction<PlaylistItem[]>>;
  onStart: (startIndex?: number) => void;
}

export const ControlPanel: React.FC<Props> = ({ playlist, setPlaylist, onStart }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const newItems: PlaylistItem[] = Array.from(files)
      .filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'))
      .map(file => ({
        id: crypto.randomUUID(),
        blob: file,
        type: file.type,
        duration: 5, // default 5 seconds
        name: file.name
      }));

    if (newItems.length > 0) {
      setPlaylist(prev => [...prev, ...newItems]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const updateDuration = (id: string, duration: number) => {
    setPlaylist(prev => prev.map(item => 
      item.id === id ? { ...item, duration: Math.max(1, duration) } : item
    ));
  };

  const removeItem = (id: string) => {
    setPlaylist(prev => prev.filter(item => item.id !== id));
  };

  const clearAll = () => {
    if (window.confirm('Are you sure you want to delete all items from the queue?')) {
      setPlaylist([]);
    }
  };

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragEnter = (index: number) => {
    setDragOverIdx(index);
  };

  const handleDragEnd = () => {
    if (draggedIdx !== null && dragOverIdx !== null && draggedIdx !== dragOverIdx) {
      setPlaylist(prev => {
        const copy = [...prev];
        const item = copy.splice(draggedIdx, 1)[0];
        copy.splice(dragOverIdx, 0, item);
        return copy;
      });
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  return (
    <div className="control-panel">
      <div className="header">
        <h1>Dot Projects Queue</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => onStart(0)}
          disabled={playlist.length === 0}
        >
          <Play size={20} />
          Start Presentation
        </button>
      </div>

      <div 
        className={`upload-area ${isDragging ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadCloud className="upload-icon" />
        <h2>Drag & Drop your media here</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>or click to browse files (Images and Videos)</p>
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          accept="image/*,video/*"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="playlist">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3>Presentation Queue ({playlist.length})</h3>
          {playlist.length > 0 && (
            <button 
              className="btn btn-icon btn-danger" 
              style={{ padding: '6px 12px', fontSize: '0.85rem' }} 
              onClick={clearAll}
              title="Clear entire queue"
            >
              <Trash2 size={14} style={{ marginRight: '6px' }} />
              Clear All
            </button>
          )}
        </div>
        
        {playlist.length === 0 ? (
          <div className="empty-state">
            <ImageIcon size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>Your queue is empty. Add some media to get started.</p>
          </div>
        ) : (
          playlist.map((item, index) => (
            <div 
              key={item.id} 
              className={`playlist-item ${draggedIdx === index ? 'dragging' : ''} ${dragOverIdx === index ? 'drag-over' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              <GripVertical className="grip-handle" size={20} />
              
              {item.type.startsWith('video/') ? (
                <video 
                  src={URL.createObjectURL(item.blob)} 
                  className="item-thumb"
                  onLoadedData={(e) => URL.revokeObjectURL((e.target as HTMLVideoElement).src)}
                />
              ) : (
                <img 
                  src={URL.createObjectURL(item.blob)} 
                  alt={item.name} 
                  className="item-thumb" 
                  onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                />
              )}
              
              <div className="item-info">
                <div className="item-name">{item.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  #{index + 1}
                </div>
              </div>
              
              <div className="item-controls">
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Duration (s):</label>
                <input 
                  type="number" 
                  min="1"
                  className="duration-input" 
                  value={item.duration}
                  onChange={(e) => updateDuration(item.id, parseInt(e.target.value) || 5)}
                />
                <button className="btn btn-icon btn-primary" onClick={() => onStart(index)} title="Play from here" style={{ padding: '8px 12px', borderRadius: '12px', background: 'var(--primary-accent)' }}>
                  <Play size={18} />
                </button>
                <button className="btn btn-icon btn-danger" onClick={() => removeItem(item.id)} title="Remove">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
