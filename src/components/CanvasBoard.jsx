import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Circle, Transformer, Arc } from 'react-konva';
import useStore, { snap } from '../store/useStore';

const GRID_SIZE = 20;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;
const SCALE_BY  = 1.08;

// ── Grid layer (dots) ─────────────────────────────────────────────────────────
function GridLayer({ stageX, stageY, stageScale, width, height }) {
  const dots = [];
  const step = GRID_SIZE * stageScale;

  // offset so dots stay in place when panning
  const offsetX = (stageX % step + step) % step;
  const offsetY = (stageY % step + step) % step;

  // major grid every 5 cells
  const cols = Math.ceil(width  / step) + 2;
  const rows = Math.ceil(height / step) + 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isMajor = (() => {
        const wx = (c * step - offsetX - stageX) / stageScale;
        const wy = (r * step - offsetY - stageY) / stageScale;
        return (Math.round(wx / GRID_SIZE) % 5 === 0) && (Math.round(wy / GRID_SIZE) % 5 === 0);
      })();

      dots.push(
        <Circle
          key={`${r}-${c}`}
          x={c * step - offsetX}
          y={r * step - offsetY}
          radius={isMajor ? 1.8 : 1}
          fill={isMajor ? '#adb5bd' : '#ced4da'}
          listening={false}
          perfectDrawEnabled={false}
        />
      );
    }
  }
  return <>{dots}</>;
}

// ── Scale ruler ───────────────────────────────────────────────────────────────
function ScaleRuler({ stageScale, gridMeters = 0.5 }) {
  const px = GRID_SIZE * stageScale * 5; // 5 cells = gridMeters * 5
  const label = `${(gridMeters * 5).toFixed(1)} m`;
  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 20,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      pointerEvents: 'none', userSelect: 'none',
    }}>
      <span style={{ fontSize: 10, color: '#868e96', marginBottom: 2, fontFamily: 'monospace' }}>
        {label} @ {Math.round(stageScale * 100)}%
      </span>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 1, height: 8, background: '#495057' }} />
        <div style={{ width: px, height: 2, background: '#495057' }} />
        <div style={{ width: 1, height: 8, background: '#495057' }} />
      </div>
    </div>
  );
}

// ── Main board ────────────────────────────────────────────────────────────────
export default function CanvasBoard({ stageRef }) {
  const {
    elements, currentTool, addElement, selectElement,
    stageScale, stageX, stageY, setViewport, resetViewport,
  } = useStore();

  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const isPanning = useRef(false);
  const lastPos   = useRef(null);

  useEffect(() => {
    const obs = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // ── wheel zoom ──────────────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.evt.preventDefault();
    const stage    = stageRef.current;
    const oldScale = stageScale;
    const pointer  = stage.getPointerPosition();

    const direction = e.evt.deltaY < 0 ? 1 : -1;
    const newScale  = Math.min(MAX_SCALE, Math.max(MIN_SCALE,
      direction > 0 ? oldScale * SCALE_BY : oldScale / SCALE_BY
    ));

    const mousePointTo = {
      x: (pointer.x - stageX) / oldScale,
      y: (pointer.y - stageY) / oldScale,
    };

    setViewport({
      stageScale: newScale,
      stageX: pointer.x - mousePointTo.x * newScale,
      stageY: pointer.y - mousePointTo.y * newScale,
    });
  }, [stageScale, stageX, stageY, setViewport, stageRef]);

  // ── middle-click / space+drag pan ───────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.evt.button === 1 || (e.evt.button === 0 && e.evt.altKey)) {
      isPanning.current = true;
      lastPos.current   = { x: e.evt.clientX, y: e.evt.clientY };
      e.evt.preventDefault();
      return;
    }

    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      if (currentTool !== 'select') {
        const stage   = e.target.getStage();
        const pointer = stage.getPointerPosition();
        // convert screen → world coords
        const wx = (pointer.x - stageX) / stageScale;
        const wy = (pointer.y - stageY) / stageScale;
        addElement(currentTool, wx, wy);
      } else {
        selectElement(null);
      }
    }
  }, [currentTool, addElement, selectElement, stageX, stageY, stageScale]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning.current) return;
    const dx = e.evt.clientX - lastPos.current.x;
    const dy = e.evt.clientY - lastPos.current.y;
    lastPos.current = { x: e.evt.clientX, y: e.evt.clientY };
    setViewport({ stageScale, stageX: stageX + dx, stageY: stageY + dy });
  }, [isPanning, stageScale, stageX, stageY, setViewport]);

  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // ── cursor ──────────────────────────────────────────────────────────────
  const cursor = currentTool !== 'select' ? 'crosshair' : 'default';

  return (
    <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor }}>
      {size.width > 0 && (
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stageX}
          y={stageY}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* grid layer — not transformed by stage scale (we render in screen space) */}
          <Layer listening={false}>
            <GridLayer
              stageX={stageX}
              stageY={stageY}
              stageScale={stageScale}
              width={size.width}
              height={size.height}
            />
          </Layer>

          {/* elements layer */}
          <Layer>
            {elements.map((el) => (
              <ShapeElement key={el.id} element={el} />
            ))}
          </Layer>
        </Stage>
      )}

      <ScaleRuler stageScale={stageScale} />

      <button
        title="Reset View (Home)"
        onClick={resetViewport}
        style={{
          position: 'absolute', bottom: 16, right: 16,
          width: 32, height: 32, borderRadius: 6,
          border: '1px solid #dee2e6', background: '#fff',
          cursor: 'pointer', fontSize: 14, color: '#495057',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,.12)',
        }}
      >⌂</button>
    </div>
  );
}

// ── Individual shape ──────────────────────────────────────────────────────────
function ShapeElement({ element }) {
  const { selectElement, selectedId, updateElement, currentTool } = useStore();
  const isSelected = selectedId === element.id;

  const shapeRef = useRef();
  const trRef    = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e) => {
    updateElement(element.id, {
      x: snap(e.target.x()),
      y: snap(e.target.y()),
    });
  };

  const handleTransformEnd = () => {
    const node   = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    updateElement(element.id, {
      x:        snap(node.x()),
      y:        snap(node.y()),
      width:    Math.max(GRID_SIZE, snap(element.width  * scaleX)),
      height:   Math.max(GRID_SIZE, snap(element.height * scaleY)),
      rotation: Math.round(node.rotation()),
    });
  };

  const handleDblClick = () => {
    if (element.type === 'door' || element.type === 'lift') {
      updateElement(element.id, { isOpen: !element.isOpen });
      return;
    }
    const newLabel = window.prompt('Rename element:', element.label ?? '');
    if (newLabel !== null) updateElement(element.id, { label: newLabel });
  };

  const strokeColor  = isSelected ? '#339af0' : '#343a40';
  const strokeWidth  = isSelected ? 2.5 : 1.5;
  const fill         = element.color;

  const renderContent = () => {
    const { width: W, height: H } = element;

    switch (element.type) {
      case 'room':
        return (
          <>
            <Rect width={W} height={H} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} strokeScaleEnabled={false} />
            <Text text={element.label} width={W} height={H} align="center" verticalAlign="middle"
              fontSize={13} fontStyle="bold" fill="#343a40" listening={false} />
          </>
        );

      case 'title':
        return (
          <Text
            text={element.label}
            fontSize={Math.max(12, H * 0.55)}
            fontStyle="bold"
            textDecoration="underline"
            fill="#212529"
            width={W}
            height={H}
            verticalAlign="middle"
          />
        );

      case 'door': {
        // Swing arc + door panel
        const open = element.isOpen;
        return (
          <Group>
            {/* hinge post */}
            <Rect width={6} height={H * 6} fill={strokeColor} strokeScaleEnabled={false} />
            {/* swing arc */}
            <Arc
              x={0} y={0}
              innerRadius={0}
              outerRadius={W}
              angle={90}
              rotation={open ? -90 : 0}
              fill="rgba(255,236,210,0.5)"
              stroke="#e67700"
              strokeWidth={1}
              strokeScaleEnabled={false}
              dash={[4, 3]}
              listening={false}
            />
            {/* door panel */}
            <Rect
              x={0} y={0}
              width={W}
              height={H}
              rotation={open ? -90 : 0}
              fill={fill}
              stroke="#e67700"
              strokeWidth={strokeWidth}
              strokeScaleEnabled={false}
            />
          </Group>
        );
      }

      case 'window':
        return (
          <Group>
            <Rect width={W} height={H} fill={fill} stroke="#1971c2" strokeWidth={strokeWidth} strokeScaleEnabled={false} />
            {/* glazing lines */}
            <Line points={[W * 0.33, 0, W * 0.33, H]} stroke="#74c0fc" strokeWidth={1} strokeScaleEnabled={false} listening={false} />
            <Line points={[W * 0.66, 0, W * 0.66, H]} stroke="#74c0fc" strokeWidth={1} strokeScaleEnabled={false} listening={false} />
          </Group>
        );

      case 'lift': {
        const dw = element.isOpen ? 6 : W / 2 - 4;
        return (
          <>
            <Rect width={W} height={H} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} strokeScaleEnabled={false} />
            {/* X cross inside lift */}
            <Line points={[8, 8, W - 8, H - 8]} stroke="#adb5bd" strokeWidth={1} strokeScaleEnabled={false} listening={false} />
            <Line points={[W - 8, 8, 8, H - 8]} stroke="#adb5bd" strokeWidth={1} strokeScaleEnabled={false} listening={false} />
            <Text text={element.label} y={H / 2 - 14} width={W} align="center" fontSize={11} fontStyle="bold" fill="#495057" listening={false} />
            {/* doors */}
            <Rect x={4}                                    y={H - 12} width={dw} height={8} fill="#f03e3e" strokeScaleEnabled={false} />
            <Rect x={element.isOpen ? W - 10 : W / 2 + 0} y={H - 12} width={dw} height={8} fill="#f03e3e" strokeScaleEnabled={false} />
          </>
        );
      }

      case 'stairs': {
        const stepH    = Math.max(8, Math.round(H / Math.max(1, Math.floor(H / 16))));
        const stepCount = Math.floor(H / stepH);
        return (
          <Group>
            <Rect width={W} height={H} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth} strokeScaleEnabled={false} />
            {Array.from({ length: stepCount - 1 }, (_, i) => (
              <Line key={i} points={[0, (i + 1) * stepH, W, (i + 1) * stepH]}
                stroke="#868e96" strokeWidth={1} strokeScaleEnabled={false} listening={false} />
            ))}
            {/* direction arrow */}
            <Line points={[W * 0.5, H - 10, W * 0.5, 10]} stroke="#495057" strokeWidth={1.5}
              strokeScaleEnabled={false} listening={false} />
            <Line points={[W * 0.5 - 6, 20, W * 0.5, 8, W * 0.5 + 6, 20]}
              stroke="#495057" strokeWidth={1.5} strokeScaleEnabled={false} listening={false} />
          </Group>
        );
      }

      default: // table, chair
        return (
          <>
            <Rect width={W} height={H} fill={fill} stroke={strokeColor} strokeWidth={strokeWidth}
              cornerRadius={element.type === 'chair' ? 4 : 2} strokeScaleEnabled={false} />
            {element.label
              ? <Text text={element.label} width={W} height={H} align="center" verticalAlign="middle"
                  fontSize={10} fill="#495057" listening={false} />
              : null}
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
        onMouseDown={() => { if (currentTool === 'select') selectElement(element.id); }}
        onDblClick={handleDblClick}
      >
        {renderContent()}
      </Group>

      {isSelected && (
        <Transformer
          ref={trRef}
          rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
          rotationSnapTolerance={8}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < GRID_SIZE || newBox.height < GRID_SIZE) return oldBox;
            return newBox;
          }}
          anchorStroke="#339af0"
          anchorFill="#fff"
          borderStroke="#339af0"
          anchorSize={8}
        />
      )}
    </React.Fragment>
  );
}
