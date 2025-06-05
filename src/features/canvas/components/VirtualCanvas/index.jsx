import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import Node from '../../../nodes/components/Node';
import Connection from '../Connection';
import { isNodeVisible } from '../../utils/viewport';
import './VirtualCanvas.css';

const VirtualCanvas = ({
  rectangles,
  transform,
  viewport,
  isDragging,
  selectedRect,
  editingRect,
  onRectClick,
  onRectDoubleClick,
  onCanvasClick,
  onDragStart,
  onZoom,
  onPan,
  onTextChange,
  onTextBlur,
  onNodeHeightChange,
  onNodeWidthChange,
  setTransform
}) => {
  const [showGrid, setShowGrid] = useState(true);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimeoutRef = useRef(null);
  
  const nodes = rectangles;
  const links = rectangles.filter(r => r.parentId).map(r => ({
    source: rectangles.find(n => n.id === r.parentId),
    target: r
  }));
  
  // 添加对SVG元素的引用
  const svgRef = useRef(null);

  // 显示缩放指示器的函数
  const showZoomIndicatorTemporarily = useCallback(() => {
    setShowZoomIndicator(true);
    
    // 清除之前的定时器
    if (zoomIndicatorTimeoutRef.current) {
      clearTimeout(zoomIndicatorTimeoutRef.current);
    }
    
    // 设置新的定时器，1.5秒后隐藏缩放指示器
    zoomIndicatorTimeoutRef.current = setTimeout(() => {
      setShowZoomIndicator(false);
    }, 1500);
  }, []);

  // 使用useEffect添加被动事件监听器
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement || !onZoom) return;

    // 滚轮事件处理函数
    const handleWheel = (event) => {
      // 显示缩放指示器
      showZoomIndicatorTemporarily();
      
      // 调用原来的缩放处理函数
      onZoom(event);
    };

    // 使用被动事件监听器添加滚轮事件
    svgElement.addEventListener('wheel', handleWheel, { passive: false });

    // 清理函数
    return () => {
      svgElement.removeEventListener('wheel', handleWheel);
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
    };
  }, [onZoom, showZoomIndicatorTemporarily]);

  // 添加防止文本选择的事件处理
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const handleMouseDown = (e) => {
      // 只有当点击的是画布元素（而不是节点）时才添加dragging-canvas类
      if (e.target === svgElement || e.target.tagName === 'svg' || e.target.classList.contains('canvas')) {
        document.body.classList.add('dragging-canvas');
      }
    };

    const handleMouseUp = () => {
      // 移除禁用文本选择的类
      document.body.classList.remove('dragging-canvas');
    };

    // 添加事件监听器
    svgElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);

    // 清理函数
    return () => {
      svgElement.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
      document.body.classList.remove('dragging-canvas');
    };
  }, []);

  // 切换网格显示
  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };
  
  // 重置视图
  const resetView = () => {
    if (setTransform) {
      // 显示缩放指示器
      showZoomIndicatorTemporarily();
      
      setTransform({
        scale: 1,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      });
    }
  };

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (zoomIndicatorTimeoutRef.current) {
        clearTimeout(zoomIndicatorTimeoutRef.current);
      }
    };
  }, []);

  const handleNodeClick = (e, id) => {
    e.stopPropagation();
    onRectClick(e, id);
  };

  const handleNodeDoubleClick = (e, id) => {
    e.stopPropagation();
    onRectDoubleClick(e, id);
  };

  const handleNodeHeightChange = (id, height) => {
    if (onNodeHeightChange) {
      onNodeHeightChange(id, height);
    }
  };

  const handleNodeWidthChange = (id, width) => {
    if (onNodeWidthChange) {
      onNodeWidthChange(id, width);
    }
  };

  const visibleNodes = useMemo(() => {
    return nodes.filter(node => isNodeVisible(node, viewport, transform.scale));
  }, [nodes, viewport, transform.scale]);

  const visibleLinks = useMemo(() => {
    return links.filter(link => {
      const sourceVisible = isNodeVisible(link.source, viewport, transform.scale);
      const targetVisible = isNodeVisible(link.target, viewport, transform.scale);
      return sourceVisible || targetVisible;
    });
  }, [links, viewport, transform.scale]);

  // 根据showGrid状态设置画布类名
  const canvasClassName = `canvas ${isDragging ? 'dragging' : ''} ${showGrid ? 'with-grid' : 'no-grid'}`;

  return (
    <div className="split-layout">
      <div className="mindmap-container">
        <svg 
          ref={svgRef}
          className={canvasClassName}
          onMouseDown={(e) => {
            // 添加dragging-canvas类
            document.body.classList.add('dragging-canvas');
            // 调用原始的onDragStart
            if (onDragStart) onDragStart(e);
          }}
          onClick={onCanvasClick}
        >
          <defs>
            <marker
              id="arrowhead"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#999"/>
            </marker>
            <marker
              id="arrowhead-hover"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#2196f3"/>
            </marker>
            <marker
              id="arrowhead-question"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#1890ff"/>
            </marker>
            <marker
              id="arrowhead-answer"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#52c41a"/>
            </marker>
          </defs>
          <g transform={`translate(${transform.x},${transform.y}) scale(${transform.scale})`}>
            {visibleLinks.map(link => (
              <Connection
                key={`${link.source.id}-${link.target.id}`}
                startNode={link.source}
                endNode={link.target}
                basePosition={{ x: 0, y: 0 }}
              />
            ))}
            {visibleNodes.map(node => (
              <Node
                key={node.id}
                node={node}
                isSelected={node.id === selectedRect}
                isEditing={node.id === editingRect}
                onClick={(e) => handleNodeClick(e, node.id)}
                onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
                onTextChange={onTextChange}
                onTextBlur={onTextBlur}
                onHeightChange={handleNodeHeightChange}
                onWidthChange={handleNodeWidthChange}
              />
            ))}
          </g>
        </svg>
        
        {/* 控制按钮组 */}
        <div className="canvas-controls">
          <button className="control-button" onClick={toggleGrid} title={showGrid ? "隐藏网格" : "显示网格"}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 2H4C2.9 2 2 2.9 2 4V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V4C22 2.9 21.1 2 20 2ZM8 20H4V16H8V20ZM8 14H4V10H8V14ZM8 8H4V4H8V8ZM14 20H10V16H14V20ZM14 14H10V10H14V14ZM14 8H10V4H14V8ZM20 20H16V16H20V20ZM20 14H16V10H20V14ZM20 8H16V4H20V8Z" fill="currentColor"/>
            </svg>
          </button>
          <button className="control-button" onClick={resetView} title="重置视图">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V1L7 6L12 11V7C15.31 7 18 9.69 18 13C18 16.31 15.31 19 12 19C8.69 19 6 16.31 6 13H4C4 17.42 7.58 21 12 21C16.42 21 20 17.42 20 13C20 8.58 16.42 5 12 5Z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="hint-text">
        Press Tab and feel free to ask
      </div>
      
      {/* 缩放指示器 - 只在showZoomIndicator为true时显示 */}
      {showZoomIndicator && (
        <div className="zoom-indicator zoom-visible">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
            <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="#444"/>
            <path d="M12 10H10V12H9V10H7V9H9V7H10V9H12V10Z" fill="#444"/>
          </svg>
          <span style={{ fontWeight: 'bold' }}>缩放: {Math.round(transform.scale * 100)}%</span>
        </div>
      )}
    </div>
  );
};

export default VirtualCanvas; 