import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Line } from 'react-konva';
import useStore from '../store/useStore';

export default function CanvasBoard() {
  const { 
    elements, currentTool, addElement, selectElement, 
    selectedId, updateElement 
  } = useStore();
  
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight - 60 });
  const stageRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight - 60 });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStageClick = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      if (currentTool !== 'select') {
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();
        addElement(currentTool, pointerPosition.x, pointerPosition.y);
      } else {
        selectElement(null); // Deselect if clicking empty space
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#fafafa' }}>
      <Stage 
        width={dimensions.width} 
        height={dimensions.height} 
        onMouseDown={handleStageClick}
        ref={stageRef}
      >
        <Layer>
          {elements.map((el) => (
            <ShapeElement key={el.id} element={el} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

// Sub-component that renders specific shapes
function ShapeElement({ element }) {
  const { selectElement, selectedId, updateElement, currentTool } = useStore();
  const isSelected = selectedId === element.id;

  const handleDragEnd = (e) => {
    updateElement(element.id, { x: e.target.x(), y: e.target.y() });
  };

  const handleDblClick = () => {
    // Open/Close Doors (Includes Lifts)
    if (element.type === 'door' || element.type === 'lift') {
      updateElement(element.id, { isOpen: !element.isOpen });
      return;
    }

    // Rename Objects
    if (element.type === 'title' || element.type === 'room' || element.type === 'lift' || element.type === 'table') {
      const newLabel = window.prompt("Enter new name:", element.label);
      if (newLabel !== null) {
        updateElement(element.id, { label: newLabel });
        return;
      }
    }

    // Rotate generic objects 45 degrees
    if (['chair', 'table', 'window', 'stairs'].includes(element.type)) {
      updateElement(element.id, { rotation: (element.rotation + 45) % 360 });
    }
  };

  // Border color based on selection
  const strokeColor = isSelected ? '#339af0' : '#212529';
  const strokeWidth = isSelected ? 3 : 2;

  const renderContent = () => {
    switch (element.type) {
      case 'room':
        return (
          <>
            <Rect width={element.width} height={element.height} fill={element.color} stroke={strokeColor} strokeWidth={strokeWidth} />
            <Text text={element.label} width={element.width} height={element.height} align="center" verticalAlign="middle" fontSize={14} fontStyle="bold" fill="#212529" />
          </>
        );
      case 'title':
        return (
          <Text text={element.label} fontSize={28} fontStyle="bold" textDecoration="underline" fill="#000" />
        );
      case 'lift':
        return (
          <>
            <Rect width={element.width} height={element.height} fill="#ced4da" stroke={strokeColor} strokeWidth={strokeWidth} />
            <Text text={element.label} y={20} width={element.width} align="center" fontSize={12} fontStyle="bold" fill="#495057" />
            {/* Interactive Lift Doors */}
            <Rect x={4} y={element.height - 10} width={element.isOpen ? 10 : (element.width / 2 - 4)} height={6} fill="#f03e3e" />
            <Rect x={element.isOpen ? element.width - 14 : element.width / 2} y={element.height - 10} width={element.isOpen ? 10 : (element.width / 2 - 4)} height={6} fill="#f03e3e" />
          </>
        );
      case 'stairs':
        return (
          <Group>
            <Rect width={element.width} height={element.height} fill="#fff" stroke={strokeColor} strokeWidth={strokeWidth} />
            {/* Draw stair steps */}
            {[...Array(10)].map((_, i) => (
              <Line key={i} points={[0, i * 12, element.width, i * 12]} stroke="#212529" strokeWidth={1} />
            ))}
          </Group>
        );
      case 'door':
        return (
          <Group rotation={element.isOpen ? -90 : 0}>
            <Rect width={element.width} height={element.height} fill="#fff" stroke="#e03131" strokeWidth={2} />
          </Group>
        );
      case 'window':
        return <Rect width={element.width} height={element.height} fill={element.color} stroke="#1971c2" strokeWidth={2} />;
      default: // Table, Chair
        return (
          <>
            <Rect width={element.width} height={element.height} fill={element.color} stroke={strokeColor} strokeWidth={strokeWidth} cornerRadius={2} />
            {element.label && <Text text={element.label} width={element.width} height={element.height} align="center" verticalAlign="middle" fontSize={10} fill="#495057" />}
          </>
        );
    }
  };

  return (
    <Group
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      draggable={currentTool === 'select'}
      onMouseDown={() => selectElement(element.id)}
      onDragEnd={handleDragEnd}
      onDblClick={handleDblClick}
      offsetX={element.type === 'door' && element.isOpen ? 0 : 0} // Doors pivot on corner
    >
      {renderContent()}
    </Group>
  );
}
