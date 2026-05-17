import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

const useStore = create((set, get) => ({
  elements: [],
  selectedId: null,
  clipboard: null,
  currentTool: 'select',
  universalColor: '#ffffff',

  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set((state) => {
    // If an element is selected, change its color immediately
    if (state.selectedId) {
      return {
        universalColor: color,
        elements: state.elements.map(el => 
          el.id === state.selectedId ? { ...el, color } : el
        )
      };
    }
    return { universalColor: color };
  }),

  selectElement: (id) => set({ selectedId: id }),

  addElement: (type, x, y) => set((state) => {
    let width = 100, height = 100, label = type.toUpperCase();
    
    // Define initial dimensions based on tool
    if (type === 'table') { width = 140; height = 35; }
    if (type === 'chair') { width = 45; height = 15; }
    if (type === 'lift') { width = 60; height = 60; }
    if (type === 'stairs') { width = 80; height = 120; }
    if (type === 'door') { width = 40; height = 6; label = ''; }
    if (type === 'window') { width = 60; height = 8; label = ''; }
    if (type === 'title') { width = 200; height = 40; label = 'Main Title'; }
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
