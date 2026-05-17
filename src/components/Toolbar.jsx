import React, { useRef } from 'react';
import useStore from '../store/useStore';

const TOOLS = [
  { id: 'select',  label: 'Select',  icon: '↖',  title: 'Select & Move (V)' },
  { id: 'room',    label: 'Room',    icon: '⬜',  title: 'Add Room (R)' },
  { id: 'door',    label: 'Door',    icon: '🚪', title: 'Add Door (D)' },
  { id: 'window',  label: 'Window',  icon: '🪟', title: 'Add Window (W)' },
  { id: 'lift',    label: 'Lift',    icon: '🛗', title: 'Add Lift (L)' },
  { id: 'stairs',  label: 'Stairs',  icon: '🪜', title: 'Add Stairs (S)' },
  { id: 'table',   label: 'Table',   icon: '▭',  title: 'Add Table (T)' },
  { id: 'chair',   label: 'Chair',   icon: '⊡',  title: 'Add Chair (C)' },
  { id: 'title',   label: 'Title',   icon: 'T',  title: 'Add Title (X)' },
];

export default function Toolbar() {
  const {
    currentTool, setTool,
    universalColor, setColor,
    undo, redo, past, future,
    clearAll,
    exportJSON, importJSON,
    bringForward, sendBackward, bringToFront, sendToBack,
    selectedId,
  } = useStore();

  const fileRef = useRef();

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => importJSON(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    if (window.confirm('Clear the entire canvas? This cannot be undone.')) clearAll();
  };

  const btn = (onClick, children, opts = {}) => (
    <button
      title={opts.title}
      disabled={opts.disabled}
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 2, padding: '5px 8px', minWidth: 44, cursor: opts.disabled ? 'not-allowed' : 'pointer',
        borderRadius: 6,
        border: opts.active ? '2px solid #339af0' : '1px solid #dee2e6',
        background: opts.active ? '#e7f5ff' : opts.danger ? '#fff5f5' : '#fff',
        color: opts.active ? '#1c7ed6' : opts.disabled ? '#ced4da' : opts.danger ? '#e03131' : '#343a40',
        fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace",
        transition: 'all 0.1s', boxShadow: opts.active ? '0 0 0 2px #a5d8ff' : 'none',
        opacity: opts.disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );

  const divider = () => (
    <div style={{ width: 1, height: 36, background: '#e9ecef', margin: '0 4px', flexShrink: 0 }} />
  );

  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '6px 12px', flexWrap: 'wrap',
      background: '#f8f9fa',
      borderBottom: '1px solid #dee2e6',
      boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      zIndex: 20, position: 'relative',
      fontFamily: "'DM Mono', monospace",
    }}>

      {/* App name */}
      <span style={{ fontSize: 13, fontWeight: 700, color: '#212529', letterSpacing: '-0.3px', marginRight: 6 }}>
        📐 Blueprint
      </span>

      {divider()}

      {/* Tool buttons */}
      {TOOLS.map(t => (
        <button
          key={t.id}
          title={t.title}
          onClick={() => setTool(t.id)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 1, padding: '4px 8px', minWidth: 46, cursor: 'pointer',
            borderRadius: 6,
            border: currentTool === t.id ? '2px solid #339af0' : '1px solid #dee2e6',
            background: currentTool === t.id ? '#e7f5ff' : '#fff',
            color: currentTool === t.id ? '#1c7ed6' : '#343a40',
            fontSize: 16, fontWeight: 600,
            boxShadow: currentTool === t.id ? '0 0 0 2px #a5d8ff' : 'none',
            transition: 'all 0.1s',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>{t.icon}</span>
          <span style={{ fontSize: 9, letterSpacing: '0.3px', opacity: 0.7 }}>{t.label}</span>
        </button>
      ))}

      {divider()}

      {/* Color */}
      <div title="Fill Color" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        cursor: 'pointer',
      }}>
        <div style={{ position: 'relative', width: 28, height: 28 }}>
          <input
            type="color"
            value={universalColor}
            onChange={(e) => setColor(e.target.value)}
            style={{
              opacity: 0, position: 'absolute', inset: 0,
              width: '100%', height: '100%', cursor: 'pointer', border: 'none', padding: 0,
            }}
          />
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: universalColor,
            border: '2px solid #dee2e6',
            boxShadow: '0 1px 3px rgba(0,0,0,.15)',
            pointerEvents: 'none',
          }} />
        </div>
        <span style={{ fontSize: 8, color: '#868e96', fontFamily: 'monospace' }}>COLOR</span>
      </div>

      {divider()}

      {/* Undo / Redo */}
      {btn(undo,  ['↩', <span key="l" style={{ fontSize: 9 }}>Undo</span>],  { title: 'Undo (Ctrl+Z)',  disabled: past.length  === 0 })}
      {btn(redo,  ['↪', <span key="l" style={{ fontSize: 9 }}>Redo</span>],  { title: 'Redo (Ctrl+Y)',  disabled: future.length === 0 })}

      {divider()}

      {/* Z-order (only when something selected) */}
      {btn(bringToFront, ['⤒', <span key="l" style={{ fontSize: 9 }}>Front</span>], { title: 'Bring to Front', disabled: !selectedId })}
      {btn(bringForward, ['↑',  <span key="l" style={{ fontSize: 9 }}>Fwd</span>],   { title: 'Bring Forward',  disabled: !selectedId })}
      {btn(sendBackward, ['↓',  <span key="l" style={{ fontSize: 9 }}>Back</span>],  { title: 'Send Backward',  disabled: !selectedId })}
      {btn(sendToBack,   ['⤓', <span key="l" style={{ fontSize: 9 }}>Bottom</span>],{ title: 'Send to Back',   disabled: !selectedId })}

      {divider()}

      {/* Export / Import / Clear */}
      {btn(exportJSON, ['⬇', <span key="l" style={{ fontSize: 9 }}>Save</span>], { title: 'Save as JSON' })}
      {btn(() => fileRef.current.click(), ['⬆', <span key="l" style={{ fontSize: 9 }}>Load</span>], { title: 'Load from JSON' })}
      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
      {btn(handleClearAll, ['✕', <span key="l" style={{ fontSize: 9 }}>Clear</span>], { title: 'Clear Canvas', danger: true })}

      {/* Shortcuts hint */}
      <div style={{
        marginLeft: 'auto', fontSize: 10, color: '#adb5bd',
        lineHeight: 1.5, fontFamily: 'monospace',
      }}>
        <strong style={{ color: '#868e96' }}>Ctrl+C/V</strong> Copy/Paste &nbsp;
        <strong style={{ color: '#868e96' }}>Del</strong> Delete &nbsp;
        <strong style={{ color: '#868e96' }}>Alt+Drag</strong> Pan &nbsp;
        <strong style={{ color: '#868e96' }}>Scroll</strong> Zoom &nbsp;
        <strong style={{ color: '#868e96' }}>Dbl-click</strong> Rename/Toggle
      </div>
    </header>
  );
}        </button>
      ))}

      <div style={{ borderLeft: '2px solid #dee2e6', paddingLeft: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🎨</span>
        <input 
          type="color" 
          value={universalColor} 
          onChange={(e) => setColor(e.target.value)}
          style={{ border: 'none', background: 'none', cursor: 'pointer', width: '30px', height: '30px' }}
        />
      </div>

      <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#868e96' }}>
        <strong>Shortcuts:</strong> Ctrl+C (Copy), Ctrl+V (Paste), Del (Delete)<br/>
        <strong>Actions:</strong> Dbl-click to Rename / Rotate / Open Doors
      </div>
    </div>
  );
}
