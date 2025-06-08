// src/components/Canvas/index.jsx
import React from 'react';
import Node from '../Node';
import Connection from '../Connection';

const Canvas = ({
  rectangles,
  basePosition,
  selectedRect,
  editingRect,
  onMouseDown,
  onCanvasClick,
  onNodeClick,
  onNodeDoubleClick,
  onTextChange,
  onTextBlur
}) => {
  return (
    <svg 
      className="canvas"
      onMouseDown={onMouseDown}
      onClick={onCanvasClick}
    >
      <defs>
        <marker
          id="arrowhead"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#999"/>
        </marker>
      </defs>
      
      {rectangles.map((rect) => (
        rect.parentId && (
          <Connection
            key={`line-${rect.id}`}
            startNode={rectangles.find(r => r.id === rect.parentId)}
            endNode={rect}
            basePosition={basePosition}
          />
        )
      ))}
      
      {rectangles.map((rect) => (
        <Node
          key={rect.id}
          node={rect}
          basePosition={basePosition}
          isSelected={selectedRect === rect.id}
          isEditing={editingRect === rect.id}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onTextChange={onTextChange}
          onTextBlur={onTextBlur}
        />
      ))}
    </svg>
  );
};

export default Canvas;