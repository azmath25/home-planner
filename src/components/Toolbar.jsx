import React from 'react';
import useStore from '../store/useStore';

const TOOLS = [
  { id: 'select', label: '🖱️ Select' },
  { id: 'title', label: '📝 Title' },
  { id: 'room', label: '⬜ Room' },
  { id: 'door', label: '🚪 Door' },
  { id: 'window', label: '🪟 Window' },
  { id: 'lift', label: '🛗 Lift' },
  { id: 'stairs', label: '🪜 Stairs' },
  { id: 'table', label: '🍱 Table' },
  { id: 'chair', label: '➖ Chair' },
];

export default function Toolbar() {
  const { currentTool, setTool, universalColor, setColor } = useStore();

  return (
    <div style={{
      display: 'flex', gap: '10px', padding: '12px 20px', 
      backgroundColor: '#fff', borderBottom: '2px solid #d1d9e0',
      alignItems: 'center', zIndex: 10
    }}>
      {TOOLS.map(t => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          style={{
            padding: '8px 12px', cursor: 'pointer', fontWeight: 'bold',
            borderRadius: '4px', border: '1px solid #adb5bd',
            backgroundColor: currentTool === t.id ? '#212529' : '#fff',
            color: currentTool === t.id ? '#fff' : '#212529',
          }}
        >
          {t.label}
        </button>
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
