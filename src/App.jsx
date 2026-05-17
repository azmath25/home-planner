import React, { useEffect, useRef } from 'react';
import Toolbar from './components/Toolbar';
import CanvasBoard from './components/CanvasBoard';
import PropertiesPanel from './components/PropertiesPanel';
import useStore from './store/useStore';

const TOOL_KEYS = {
  v: 'select', r: 'room', d: 'door', w: 'window',
  l: 'lift',   s: 'stairs', t: 'table', c: 'chair', x: 'title',
};

export default function App() {
  const {
    copySelected, pasteClipboard, deleteSelected,
    undo, redo, setTool,
    stageScale, stageX, stageY,
  } = useStore();

  const stageRef = useRef(null);

  // ── export PNG ────────────────────────────────────────────────────────────
  const exportPNG = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const url = stage.toDataURL({ pixelRatio: 2 });
    const a   = document.createElement('a');
    a.href    = url;
    a.download = 'blueprint.png';
    a.click();
  };

  // ── keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
      if (ctrl && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault(); redo(); return;
      }
      if (ctrl && e.key.toLowerCase() === 'c') { copySelected(); return; }
      if (ctrl && e.key.toLowerCase() === 'v') { pasteClipboard(); return; }
      if (ctrl && e.key.toLowerCase() === 'e') { e.preventDefault(); exportPNG(); return; }

      if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); return; }
      if (e.key === 'Escape') { setTool('select'); return; }

      const tool = TOOL_KEYS[e.key.toLowerCase()];
      if (tool) setTool(tool);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [copySelected, pasteClipboard, deleteSelected, undo, redo, setTool]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Toolbar stageRef={stageRef} onExportPNG={exportPNG} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <CanvasBoard stageRef={stageRef} />
        <PropertiesPanel />
      </div>
    </div>
  );
}
