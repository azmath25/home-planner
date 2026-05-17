import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const GRID_SIZE = 20;
export const snap = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE;

const INITIAL_DEFAULTS = {
  room:    { width: 160, height: 120, label: 'Room' },
  table:   { width: 140, height:  60, label: 'Table' },
  chair:   { width:  40, height:  40, label: '' },
  lift:    { width:  80, height:  80, label: 'Lift' },
  stairs:  { width:  80, height: 120, label: 'Stairs' },
  door:    { width:  60, height:   8, label: '' },
  window:  { width:  80, height:   8, label: '' },
  title:   { width: 240, height:  48, label: 'Floor Title' },
};

const DEFAULT_COLORS = {
  window: '#e7f5ff',
  door:   '#fff4e6',
  room:   '#ffffff',
};

// ── history helpers ──────────────────────────────────────────────────────────
const MAX_HISTORY = 60;

function pushHistory(past, present) {
  const next = [...past, present];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

// ── store ────────────────────────────────────────────────────────────────────
const useStore = create((set, get) => ({
  // canvas state (snapshotted for undo)
  elements:  [],
  selectedId: null,

  // undo/redo stacks (arrays of elements[])
  past:   [],
  future: [],

  // tool / ui
  clipboard:      null,
  currentTool:    'select',
  universalColor: '#ffffff',

  // viewport (NOT in undo history)
  stageScale: 1,
  stageX:     0,
  stageY:     0,

  // ── viewport ──────────────────────────────────────────────────────────────
  setViewport: ({ stageScale, stageX, stageY }) =>
    set({ stageScale, stageX, stageY }),

  resetViewport: () => set({ stageScale: 1, stageX: 0, stageY: 0 }),

  // ── tool ──────────────────────────────────────────────────────────────────
  setTool: (tool) => set({ currentTool: tool }),

  setColor: (color) => set((state) => {
    if (state.selectedId) {
      const elements = state.elements.map(el =>
        el.id === state.selectedId ? { ...el, color } : el
      );
      return {
        universalColor: color,
        elements,
        past: pushHistory(state.past, state.elements),
        future: [],
      };
    }
    return { universalColor: color };
  }),

  // ── selection ─────────────────────────────────────────────────────────────
  selectElement: (id) => set((state) => {
    const el = id ? state.elements.find(e => e.id === id) : null;
    return {
      selectedId: id,
      universalColor: el ? el.color : state.universalColor,
    };
  }),

  // ── add ───────────────────────────────────────────────────────────────────
  addElement: (type, x, y) => set((state) => {
    const def = INITIAL_DEFAULTS[type] || { width: 100, height: 100, label: type.toUpperCase() };
    const color = DEFAULT_COLORS[type] ?? state.universalColor;

    const el = {
      id: uuidv4(),
      type,
      x: snap(x - def.width  / 2),
      y: snap(y - def.height / 2),
      width:    def.width,
      height:   def.height,
      rotation: 0,
      color,
      label:    def.label,
      isOpen:   false,
    };

    return {
      elements:  [...state.elements, el],
      selectedId: el.id,
      currentTool: 'select',
      universalColor: color,
      past:   pushHistory(state.past, state.elements),
      future: [],
    };
  }),

  // ── update ────────────────────────────────────────────────────────────────
  updateElement: (id, newProps, { skipHistory = false } = {}) =>
    set((state) => ({
      elements: state.elements.map(el => el.id === id ? { ...el, ...newProps } : el),
      past:   skipHistory ? state.past : pushHistory(state.past, state.elements),
      future: skipHistory ? state.future : [],
    })),

  // ── delete ────────────────────────────────────────────────────────────────
  deleteSelected: () => set((state) => {
    if (!state.selectedId) return state;
    return {
      elements:   state.elements.filter(el => el.id !== state.selectedId),
      selectedId: null,
      past:   pushHistory(state.past, state.elements),
      future: [],
    };
  }),

  clearAll: () => set((state) => ({
    past:       pushHistory(state.past, state.elements),
    future:     [],
    elements:   [],
    selectedId: null,
  })),

  // ── z-order ───────────────────────────────────────────────────────────────
  bringForward: () => set((state) => {
    const idx = state.elements.findIndex(e => e.id === state.selectedId);
    if (idx < 0 || idx === state.elements.length - 1) return state;
    const els = [...state.elements];
    [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
    return { elements: els, past: pushHistory(state.past, state.elements), future: [] };
  }),

  sendBackward: () => set((state) => {
    const idx = state.elements.findIndex(e => e.id === state.selectedId);
    if (idx <= 0) return state;
    const els = [...state.elements];
    [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
    return { elements: els, past: pushHistory(state.past, state.elements), future: [] };
  }),

  bringToFront: () => set((state) => {
    const idx = state.elements.findIndex(e => e.id === state.selectedId);
    if (idx < 0) return state;
    const els = [...state.elements];
    const [el] = els.splice(idx, 1);
    return { elements: [...els, el], past: pushHistory(state.past, state.elements), future: [] };
  }),

  sendToBack: () => set((state) => {
    const idx = state.elements.findIndex(e => e.id === state.selectedId);
    if (idx < 0) return state;
    const els = [...state.elements];
    const [el] = els.splice(idx, 1);
    return { elements: [el, ...els], past: pushHistory(state.past, state.elements), future: [] };
  }),

  // ── undo / redo ───────────────────────────────────────────────────────────
  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    return {
      elements:   previous,
      past:       state.past.slice(0, -1),
      future:     [state.elements, ...state.future],
      selectedId: null,
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    return {
      elements:   next,
      past:       pushHistory(state.past, state.elements),
      future:     state.future.slice(1),
      selectedId: null,
    };
  }),

  // ── copy / paste ──────────────────────────────────────────────────────────
  copySelected: () => set((state) => {
    const el = state.elements.find(e => e.id === state.selectedId);
    return el ? { clipboard: el } : {};
  }),

  pasteClipboard: () => set((state) => {
    if (!state.clipboard) return state;
    const clone = {
      ...state.clipboard,
      id: uuidv4(),
      x:  state.clipboard.x + GRID_SIZE * 2,
      y:  state.clipboard.y + GRID_SIZE * 2,
    };
    return {
      elements:    [...state.elements, clone],
      selectedId:  clone.id,
      currentTool: 'select',
      past:   pushHistory(state.past, state.elements),
      future: [],
    };
  }),

  // ── save / load ───────────────────────────────────────────────────────────
  exportJSON: () => {
    const { elements } = get();
    const blob = new Blob([JSON.stringify({ version: 1, elements }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'blueprint.json';
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON: (json) => {
    try {
      const data = JSON.parse(json);
      const elements = data.elements ?? [];
      set((state) => ({
        elements,
        selectedId: null,
        past:   pushHistory(state.past, state.elements),
        future: [],
      }));
    } catch {
      alert('Invalid JSON file.');
    }
  },
}));

export default useStore;    if (type === 'title') { width = 200; height = 40; label = 'Main Title'; }
    if (type === 'room') { label = 'Room'; }

    const newElement = {
      id: uuidv4(),
      type,
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
      rotation: 0,
      color: type === 'window' ? '#e7f5ff' : state.universalColor,
      label,
      isOpen: false // For lifts and doors
    };

    return {
      elements: [...state.elements, newElement],
      selectedId: newElement.id,
      currentTool: 'select' // Reset to select mode after drawing
    };
  }),

  updateElement: (id, newProps) => set((state) => ({
    elements: state.elements.map(el => el.id === id ? { ...el, ...newProps } : el)
  })),

  deleteSelected: () => set((state) => ({
    elements: state.elements.filter(el => el.id !== state.selectedId),
    selectedId: null
  })),

  copySelected: () => set((state) => {
    const el = state.elements.find(e => e.id === state.selectedId);
    return el ? { clipboard: el } : {};
  }),

  pasteClipboard: () => set((state) => {
    if (!state.clipboard) return state;
    const clone = {
      ...state.clipboard,
      id: uuidv4(),
      x: state.clipboard.x + 20, // Shift slightly
      y: state.clipboard.y + 20,
    };
    return {
      elements: [...state.elements, clone],
      selectedId: clone.id
    };
  })
}));

export default useStore;
