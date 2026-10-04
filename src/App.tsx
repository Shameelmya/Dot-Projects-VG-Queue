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
