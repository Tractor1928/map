// src/components/Node/index.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import './Node.css';
import { marked } from 'marked';
import { debounce } from 'lodash'; // 确保项目中安装了lodash

// 最大允许输入的字符数
const MAX_INPUT_LENGTH = 5000;

const Node = ({ 
  node, 
  isSelected, 
  isEditing,
  onClick,
  onDoubleClick,
  onTextChange,
  onTextBlur,
  onHeightChange, // 高度变化回调
  onWidthChange   // 添加宽度变化回调
}) => {
  // 添加文本区域引用
  const textareaRef = useRef(null);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(node.height);
  const [contentWidth, setContentWidth] = useState(node.width);
  const [renderedHtml, setRenderedHtml] = useState('');
  
  // 使用useEffect缓存Markdown渲染结果，避免重复渲染
  useEffect(() => {
    if (!isEditing && node.text) {
      try {
        // 限制渲染的文本长度
        const textToRender = node.text.length > MAX_INPUT_LENGTH 
          ? node.text.substring(0, MAX_INPUT_LENGTH) + '...(文本过长)' 
          : node.text;
        
        // 使用marked渲染Markdown
        const html = marked(textToRender || '');
        setRenderedHtml(html);
      } catch (error) {
        console.error('Markdown渲染错误:', error);
        setRenderedHtml(`<p>${node.text}</p>`);
      }
    }
  }, [isEditing, node.text]);
  
  // 添加自动调整高度的效果
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 500)}px`; // 限制最大高度
    }
  }, [isEditing, node.text]);

  // 创建防抖的尺寸变化处理函数
  const debouncedHeightChange = useCallback(
    debounce((id, height) => {
      if (onHeightChange) {
        onHeightChange(id, height);
      }
    }, 200), // 200ms防抖
    [onHeightChange]
  );

  const debouncedWidthChange = useCallback(
    debounce((id, width) => {
      if (onWidthChange) {
        onWidthChange(id, width);
      }
    }, 200), // 200ms防抖
    [onWidthChange]
  );

  // 使用 ResizeObserver 监测内容高度和宽度变化
  useEffect(() => {
    if (!contentRef.current) return;
    
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        // 处理高度变化
        const newHeight = Math.max(entry.contentRect.height + 16, 100); // 16px 为上下 padding 总和
        if (Math.abs(newHeight - contentHeight) > 10) { // 增加阈值，减少更新频率
          setContentHeight(newHeight);
          debouncedHeightChange(node.id, newHeight);
        }
        
        // 处理宽度变化
        const newWidth = Math.max(entry.contentRect.width + 16, 200); // 16px 为左右 padding 总和
        if (Math.abs(newWidth - contentWidth) > 10 && newWidth <= 600) { // 增加阈值，减少更新频率
          setContentWidth(newWidth);
          debouncedWidthChange(node.id, newWidth);
        }
      }
    });
    
    resizeObserver.observe(contentRef.current);
    
    return () => {
      resizeObserver.disconnect();
      debouncedHeightChange.cancel();
      debouncedWidthChange.cancel();
    };
  }, [node.id, contentHeight, contentWidth, debouncedHeightChange, debouncedWidthChange]);

  // 配置 marked 选项
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  const handleMouseDown = (e) => {
    // 阻止事件冒泡，这样节点的点击不会触发画布的拖拽
    e.stopPropagation();
  };

  // 处理文本变化，限制输入长度
  const handleTextChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_INPUT_LENGTH) {
      onTextChange?.(node.id, value);
    } else {
      // 如果超出长度限制，截断文本
      onTextChange?.(node.id, value.substring(0, MAX_INPUT_LENGTH));
      // 可以添加提示，但使用console而不是alert，避免阻塞UI
      console.warn(`文本长度已超过${MAX_INPUT_LENGTH}字符限制，多余内容将被截断`);
    }
  };

  // 新增处理键盘事件的函数
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onTextBlur();
    }
  };

  const renderText = () => {
    // 只有问题节点且处于编辑状态时才显示文本框
    if (isEditing && node.type === 'question') {
      return (
        <textarea
          ref={textareaRef}
          value={node.text}
          onChange={handleTextChange}
          onBlur={onTextBlur}
          onKeyDown={handleKeyDown}
          className="node-textarea"
          autoFocus
          placeholder="输入你的问题..."
          maxLength={MAX_INPUT_LENGTH}
        />
      );
    }

    // 使用缓存的HTML内容
    return (
      <div 
        ref={contentRef}
        className="node-text"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  };

  return (
    <g
      transform={`translate(${node.x},${node.y})`}
      onMouseDown={handleMouseDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`node ${isSelected ? 'selected' : ''} ${node.type}`}
    >
      {/* 添加选中状态的光晕效果 */}
      {isSelected && (
        <>
          <rect
            width={node.width + 10}
            height={contentHeight + 10}
            x={-5}
            y={-5}
            rx={12}
            ry={12}
            className="node-selection-halo"
            style={{ 
              fill: 'none',
              stroke: node.type === 'question' ? '#1890ff' : node.type === 'answer' ? '#52c41a' : '#2196f3',
              strokeWidth: 1,
              strokeDasharray: '5,3',
              strokeOpacity: 0.6,
              pointerEvents: 'none'
            }}
          />
          <rect
            width={node.width + 20}
            height={contentHeight + 20}
            x={-10}
            y={-10}
            rx={16}
            ry={16}
            style={{ 
              fill: 'none',
              stroke: node.type === 'question' ? '#1890ff' : node.type === 'answer' ? '#52c41a' : '#2196f3',
              strokeWidth: 0.5,
              strokeOpacity: 0.3,
              pointerEvents: 'none',
              animation: 'haloAnimation 2s infinite ease-in-out alternate',
              animationDelay: '0.5s'
            }}
          />
        </>
      )}
      <rect
        width={node.width}
        height={contentHeight}
        rx={8}
        ry={8}
        className={`node-rect ${node.type}`}
        style={{ transition: 'height 0.3s ease, width 0.3s ease' }}
      />
      <foreignObject
        width={node.width}
        height={contentHeight}
        className="node-content"
        style={{ transition: 'height 0.3s ease, width 0.3s ease' }}
      >
        {renderText()}
      </foreignObject>
    </g>
  );
};

export default Node;