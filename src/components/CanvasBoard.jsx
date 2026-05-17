import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Transformer } from 'react-konva';
import useStore from '../store/useStore';

const GRID_SIZE = 20;

// Helper to snap coordinates and sizes to the 20px grid
const snap = (val) => Math.round(val / GRID_SIZE) * GRID_SIZE;

export default function CanvasBoard() {
  const { elements, currentTool, addElement, selectElement, selectedId } = useStore();
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
        // Snap newly created elements to the grid
        addElement(currentTool, snap(pointerPosition.x), snap(pointerPosition.y));
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

function ShapeElement({ element }) {
  const { selectElement, selectedId, updateElement, currentTool } = useStore();
  const isSelected = selectedId === element.id;
  
  const shapeRef = useRef();
  const trRef = useRef();

  // Attach the Transformer (Resizer/Rotator box) when selected
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e) => {
    updateElement(element.id, {
      x: snap(e.target.x()),
      y: snap(e.target.y())
    });
  };

  const handleTransformEnd = (e) => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale immediately so strokes/borders never get permanently stretched
    node.scaleX(1);
    node.scaleY(1);

    updateElement(element.id, {
      x: snap(node.x()),
      y: snap(node.y()),
      width: Math.max(GRID_SIZE, snap(element.width * scaleX)),
      height: Math.max(GRID_SIZE, snap(element.height * scaleY)),
      rotation: Math.round(node.rotation())
    });
  };

  const handleDblClick = () => {
    // Open/Close Doors and Lifts
    if (element.type === 'door' || element.type === 'lift') {
      updateElement(element.id, { isOpen: !element.isOpen });
      return;
    }
    // Rename everything else
    const newLabel = window.prompt("Enter new name:", element.label);
    if (newLabel !== null) {
      updateElement(element.id, { label: newLabel });
    }
  };

  const strokeColor = isSelected ? '#339af0' : '#212529';
  const strokeWidth = isSelected ? 3 : 2;
  const fillColor = element.color; // Recolor now applies to all elements

  const renderContent = () => {
    // Generate dynamic stair lines based on height
    const stepCount = Math.max(1, Math.floor(element.height / 12));
    const stairsLines = Array.from({ length: stepCount - 1 }).map((_, i) => (
      <Line key={i} points={[0, (i + 1) * 12, element.width, (i + 1) * 12]} stroke="#212529" strokeWidth={1} />
    ));

    // Calculate lift door logic cleanly
    const doorWidth = element.isOpen ? 10 : (element.width / 2 - 4);

    switch (element.type) {
      case 'room':
        return (
          <>
            <Rect width={element.width} height={element.height} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeScaleEnabled={false} />
            <Text text={element.label} width={element.width} height={element.height} align="center" verticalAlign="middle" fontSize={14} fontStyle="bold" fill="#212529" />
          </>
        );
      case 'title':
        return <Text text={element.label} fontSize={28} fontStyle="bold" textDecoration="underline" fill="#000" />;
      case 'lift':
        return (
          <>
            <Rect width={element.width} height={element.height} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeScaleEnabled={false} />
            <Text text={element.label} y={element.height / 2 - 15} width={element.width} align="center" fontSize={12} fontStyle="bold" fill="#495057" />
            <Rect x={4} y={element.height - 10} width={doorWidth} height={6} fill="#f03e3e" strokeScaleEnabled={false} />
            <Rect x={element.isOpen ? element.width - 14 : element.width / 2} y={element.height - 10} width={doorWidth} height={6} fill="#f03e3e" strokeScaleEnabled={false} />
          </>
        );
      case 'stairs':
        return (
          <Group>
            <Rect width={element.width} height={element.height} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeScaleEnabled={false} />
            {stairsLines}
          </Group>
        );
      case 'door':
        return (
          <Group rotation={element.isOpen ? -90 : 0}>
            <Rect width={element.width} height={element.height} fill={fillColor} stroke="#e03131" strokeWidth={2} strokeScaleEnabled={false} />
          </Group>
        );
      case 'window':
        return <Rect width={element.width} height={element.height} fill={fillColor} stroke="#1971c2" strokeWidth={2} strokeScaleEnabled={false} />;
      default: // table, chair
        return (
          <>
            <Rect width={element.width} height={element.height} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} cornerRadius={2} strokeScaleEnabled={false} />
            {element.label && <Text text={element.label} width={element.width} height={element.height} align="center" verticalAlign="middle" fontSize={10} fill="#495057" />}
          </>
        );
    }
  };

  return (
    <React.Fragment>
      <Group
        ref={shapeRef}
        x={element.x}
        y={element.y}
        rotation={element.rotation || 0}
        draggable={currentTool === 'select'}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onMouseDown={() => selectElement(element.id)}
        onDblClick={handleDblClick}
      >
        {renderContent()}
      </Group>
      
      {/* The Transformer: Allows Resizing and Rotating when selected */}
      {isSelected && (
        <Transformer 
          ref={trRef} 
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]} 
          boundBoxFunc={(oldBox, newBox) => {
            // Prevent shrinking smaller than 1 grid square (20px)
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
}
