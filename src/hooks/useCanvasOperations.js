// src/hooks/useCanvasOperations.js
import { useState } from 'react';

export const useCanvasOperations = () => {
  const [basePosition, setBasePosition] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    const startX = e.clientX - basePosition.x;
    const startY = e.clientY - basePosition.y;

    const handleMouseMove = (e) => {
      setBasePosition({
        x: e.clientX - startX,
        y: e.clientY - startY
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return {
    basePosition,
    handleMouseDown
  };
};