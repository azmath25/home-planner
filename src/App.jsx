import React, { useEffect } from 'react';
import Toolbar from './components/Toolbar';
import CanvasBoard from './components/CanvasBoard';
import useStore from './store/useStore';

function App() {
  const { copySelected, pasteClipboard, deleteSelected } = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        copySelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        pasteClipboard();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copySelected, pasteClipboard, deleteSelected]);

  return (
    <>
      <Toolbar />
      <CanvasBoard />
    </>
  );
}

export default App;
