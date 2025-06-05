import { useState, useCallback } from 'react';

export const useZoom = (initialWidth, initialHeight) => {
  const [transform, setTransform] = useState({ 
    scale: 1, 
    x: initialWidth / 2, 
    y: initialHeight / 2 
  });

  const handleZoom = useCallback((event) => {
    // 阻止默认滚动行为
    event.preventDefault();
    
    const scaleChange = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(0.1, transform.scale * scaleChange), 4);
    
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    setTransform(prev => ({
      scale: newScale,
      x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
      y: mouseY - (mouseY - prev.y) * (newScale / prev.scale)
    }));
  }, [transform.scale]);

  const handlePan = useCallback((dx, dy) => {
    setTransform(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy
    }));
  }, []);

  // 添加拖拽功能
  const handleDragStart = useCallback((e) => {
    const startX = e.clientX - transform.x;
    const startY = e.clientY - transform.y;

    const handleDrag = (e) => {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - startX,
        y: e.clientY - startY
      }));
    };

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  }, [transform.x, transform.y]);

  return {
    transform,
    setTransform,
    handleZoom,
    handlePan,
    handleDragStart
  };
}; 