import { useState, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { PresentationView } from './components/PresentationView';
import type { PlaylistItem } from './types';
import { savePlaylist, loadPlaylist } from './lib/db';

import { ControllerApp } from './ControllerApp';
import { PresenterApp } from './PresenterApp';

function App() {
  const isPresenter = window.location.search.includes('mode=presenter');

  if (isPresenter) {
    return <PresenterApp />;
  }

  return <ControllerApp />;
}

export default App;
