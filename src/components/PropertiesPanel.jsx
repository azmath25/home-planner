import React from 'react';
import useStore, { snap } from '../store/useStore';

const GRID = 20;

export default function PropertiesPanel() {
  const { selectedId, elements, updateElement, deleteSelected } = useStore();
  const el = elements.find(e => e.id === selectedId);

  if (!el) {
    return (
      <aside style={panelStyle}>
        <div style={headerStyle}>PROPERTIES</div>
        <div style={{ padding: '16px 12px', color: '#adb5bd', fontSize: 11, textAlign: 'center', lineHeight: 1.6 }}>
          Select an element<br />to edit its properties
        </div>
      </aside>
    );
  }

  const update = (key, raw) => {
    let val = parseFloat(raw);
    if (isNaN(val)) return;
    if (key === 'width' || key === 'height') val = Math.max(GRID, snap(val));
    if (key === 'x' || key === 'y') val = snap(val);
    if (key === 'rotation') val = ((Math.round(val) % 360) + 360) % 360;
    updateElement(el.id, { [key]: val });
  };

  const field = (label, key, unit = 'px') => (
    <label style={fieldStyle} key={key}>
      <span style={labelStyle}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="number"
          value={key === 'rotation' ? (el[key] || 0) : (el[key] ?? 0)}
          step={key === 'rotation' ? 1 : GRID}
          onChange={(e) => update(key, e.target.value)}
          onBlur={(e) => update(key, e.target.value)}
          style={inputStyle}
        />
        <span style={{ fontSize: 9, color: '#adb5bd', minWidth: 16 }}>{unit}</span>
      </div>
    </label>
  );

  return (
    <aside style={panelStyle}>
      <div style={headerStyle}>PROPERTIES</div>

      {/* Type badge */}
      <div style={{ padding: '8px 12px 4px' }}>
        <span style={{
          display: 'inline-block', padding: '2px 8px',
          background: '#e9ecef', borderRadius: 4,
          fontSize: 10, fontWeight: 700, color: '#495057', letterSpacing: '0.5px',
          textTransform: 'uppercase', fontFamily: 'monospace',
        }}>
          {el.type}
        </span>
      </div>

      {/* Label */}
      {el.type !== 'door' && el.type !== 'window' && (
        <label style={{ ...fieldStyle, flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
          <span style={labelStyle}>LABEL</span>
          <input
            type="text"
            value={el.label ?? ''}
            onChange={(e) => updateElement(el.id, { label: e.target.value }, { skipHistory: true })}
            onBlur={(e) => updateElement(el.id, { label: e.target.value })}
            placeholder="Enter label…"
            style={{ ...inputStyle, width: '100%', textAlign: 'left' }}
          />
        </label>
      )}

      <div style={sectionStyle}>POSITION</div>
      {field('X', 'x')}
      {field('Y', 'y')}

      <div style={sectionStyle}>SIZE</div>
      {field('W', 'width')}
      {field('H', 'height')}

      <div style={sectionStyle}>TRANSFORM</div>
      {field('°', 'rotation', 'deg')}

      {/* Color */}
      <div style={sectionStyle}>COLOR</div>
      <label style={{ ...fieldStyle, justifyContent: 'flex-start', gap: 8 }}>
        <span style={labelStyle}>FILL</span>
        <div style={{ position: 'relative' }}>
          <input
            type="color"
            value={el.color}
            onChange={(e) => updateElement(el.id, { color: e.target.value }, { skipHistory: true })}
            onBlur={(e) => updateElement(el.id, { color: e.target.value })}
            style={{
              opacity: 0, position: 'absolute', inset: 0,
              width: '100%', height: '100%', cursor: 'pointer', border: 'none',
            }}
          />
          <div style={{
            width: 24, height: 24, borderRadius: 4,
            background: el.color,
            border: '1.5px solid #dee2e6',
            pointerEvents: 'none',
          }} />
        </div>
        <span style={{ fontSize: 10, color: '#868e96', fontFamily: 'monospace' }}>{el.color}</span>
      </label>

      {/* Open/close for door & lift */}
      {(el.type === 'door' || el.type === 'lift') && (
        <>
          <div style={sectionStyle}>STATE</div>
          <label style={{ ...fieldStyle, cursor: 'pointer', gap: 8 }}>
            <span style={labelStyle}>OPEN</span>
            <input
              type="checkbox"
              checked={!!el.isOpen}
              onChange={(e) => updateElement(el.id, { isOpen: e.target.checked })}
              style={{ width: 14, height: 14, cursor: 'pointer' }}
            />
          </label>
        </>
      )}

      {/* Delete */}
      <div style={{ padding: '12px 10px 10px', marginTop: 'auto' }}>
        <button
          onClick={deleteSelected}
          style={{
            width: '100%', padding: '7px 0', borderRadius: 6,
            border: '1px solid #ffc9c9', background: '#fff5f5',
            color: '#e03131', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'monospace', letterSpacing: '0.3px',
          }}
        >
          ✕ DELETE ELEMENT
        </button>
      </div>
    </aside>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const panelStyle = {
  width: 180, minWidth: 180,
  borderLeft: '1px solid #dee2e6',
  background: '#f8f9fa',
  overflowY: 'auto',
  display: 'flex', flexDirection: 'column',
  fontFamily: "'DM Mono', monospace",
};

const headerStyle = {
  padding: '10px 12px 6px',
  fontSize: 10, fontWeight: 700,
  letterSpacing: '1px', color: '#868e96',
  borderBottom: '1px solid #e9ecef',
};

const sectionStyle = {
  padding: '8px 12px 2px',
  fontSize: 9, fontWeight: 700,
  letterSpacing: '0.8px', color: '#adb5bd',
};

const fieldStyle = {
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between',
  padding: '3px 10px',
  gap: 4,
};

const labelStyle = {
  fontSize: 9, fontWeight: 700,
  color: '#868e96', letterSpacing: '0.5px',
  minWidth: 20,
};

const inputStyle = {
  width: 64, padding: '3px 5px',
  border: '1px solid #dee2e6', borderRadius: 4,
  fontSize: 11, fontFamily: 'monospace',
  background: '#fff', color: '#212529',
  textAlign: 'right',
  outline: 'none',
};
