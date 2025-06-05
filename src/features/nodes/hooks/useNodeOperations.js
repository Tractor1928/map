// src/hooks/useNodeOperations.js
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RectNode, NODE_TYPES } from '../models/RectNode';
import { defaultLayoutService } from '../../layout/services/LayoutService';
import { debounce } from 'lodash'; // 确保项目中安装了lodash

export const useNodeOperations = () => {
  const [rectangles, setRectangles] = useState([]);
  const [selectedRect, setSelectedRect] = useState(null);
  const [editingRect, setEditingRect] = useState(null);
  const [shouldUpdateLayout, setShouldUpdateLayout] = useState(false);
  
  // 使用默认布局服务
  const layoutService = useMemo(() => defaultLayoutService, []);
  
  // 使用ref跟踪文本更新状态，避免频繁触发布局更新
  const textUpdateTimerRef = useRef(null);
  const pendingUpdatesRef = useRef(new Map());

  // 创建防抖的布局更新函数
  const debouncedLayoutUpdate = useCallback(
    debounce(() => {
      setShouldUpdateLayout(true);
    }, 300), // 300ms防抖
    []
  );

  // 仅在节点添加或删除时更新布局
  useEffect(() => {
    if (shouldUpdateLayout && rectangles.length > 0) {
      const updatedRects = layoutService.calculateLayout([...rectangles]);
      setRectangles(updatedRects);
      setShouldUpdateLayout(false);
    }
  }, [shouldUpdateLayout, rectangles, layoutService]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (textUpdateTimerRef.current) {
        clearTimeout(textUpdateTimerRef.current);
      }
      debouncedLayoutUpdate.cancel();
    };
  }, [debouncedLayoutUpdate]);

  const addNode = useCallback((currentRect, initialText = '', type = null) => {
    // 如果没有当前选中的节点，说明是第一层
    const newLevel = currentRect ? currentRect.level + 1 : 0;
    
    // 如果没有指定类型，则根据层级决定类型
    const nodeType = type || (newLevel % 2 === 0 ? 
      NODE_TYPES.QUESTION : 
      NODE_TYPES.ANSWER);

    const newNode = new RectNode(
      Date.now(),
      0,
      0,
      initialText,
      nodeType
    );

    if (currentRect) {
      newNode.setParent(currentRect.id);
      newNode.setLevel(newLevel);
      const updatedRects = rectangles.map(rect => {
        if (rect.id === currentRect.id) {
          const updatedRect = new RectNode(
            rect.id,
            rect.x,
            rect.y,
            rect.text,
            rect.type
          );
          updatedRect.parentId = rect.parentId;
          updatedRect.childrenIds = [...rect.childrenIds];
          updatedRect.level = rect.level;
          updatedRect.addChild(newNode.id);
          return updatedRect;
        }
        return rect;
      });
      setRectangles([...updatedRects, newNode]);
    } else {
      setRectangles([...rectangles, newNode]);
    }

    setSelectedRect(newNode.id);
    setEditingRect(newNode.id);
    setShouldUpdateLayout(true);
    
    return newNode;
  }, [rectangles]);

  const updateNodeText = useCallback((id, text) => {
    // 立即更新文本，确保用户输入的即时反馈
    setRectangles(prev => {
      // 检查文本是否有实质性变化
      const currentNode = prev.find(rect => rect.id === id);
      if (currentNode && currentNode.text === text) {
        return prev; // 如果文本没有变化，不更新状态
      }
      
      return prev.map(rect => {
        if (rect.id === id) {
          const updatedRect = new RectNode(
            rect.id,
            rect.x,
            rect.y,
            text,
            rect.type
          );
          updatedRect.parentId = rect.parentId;
          updatedRect.childrenIds = [...rect.childrenIds];
          updatedRect.level = rect.level;
          updatedRect.updateText(text);
          return updatedRect;
        }
        return rect;
      });
    });
    
    // 使用防抖函数延迟触发布局更新
    // 将尺寸变化检测和布局更新延迟处理
    if (textUpdateTimerRef.current) {
      clearTimeout(textUpdateTimerRef.current);
    }
    
    textUpdateTimerRef.current = setTimeout(() => {
      setRectangles(prev => {
        const currentNode = prev.find(rect => rect.id === id);
        if (!currentNode) return prev;
        
        // 检查当前节点与初始状态相比是否有显著尺寸变化
        const initialNode = rectangles.find(r => r.id === id);
        if (initialNode && (
            Math.abs(currentNode.width - initialNode.width) > 10 || 
            Math.abs(currentNode.height - initialNode.height) > 10
        )) {
          // 如果有显著变化，触发布局更新
          debouncedLayoutUpdate();
        }
        
        return prev;
      });
    }, 500); // 延迟500ms检查尺寸变化
  }, [rectangles, debouncedLayoutUpdate]);

  const deleteNode = useCallback((id) => {
    setRectangles(prev => {
      // 找到要删除的节点及其所有子节点
      const nodeToDelete = prev.find(r => r.id === id);
      if (!nodeToDelete) return prev;
      
      // 获取所有需要删除的节点ID(包括子节点)
      const idsToDelete = new Set([id]);
      const getChildrenIds = (nodeId) => {
        const node = prev.find(r => r.id === nodeId);
        if (node && node.childrenIds.length > 0) {
          node.childrenIds.forEach(childId => {
            idsToDelete.add(childId);
            getChildrenIds(childId);
          });
        }
      };
      getChildrenIds(id);
      
      // 更新父节点的 childrenIds
      const updatedRects = prev.map(rect => {
        if (rect.id === nodeToDelete.parentId) {
          const updatedRect = new RectNode(
            rect.id,
            rect.x,
            rect.y,
            rect.text,
            rect.type
          );
          updatedRect.parentId = rect.parentId;
          updatedRect.childrenIds = rect.childrenIds.filter(cid => cid !== id);
          updatedRect.level = rect.level;
          return updatedRect;
        }
        return rect;
      });
      
      // 过滤掉要删除的节点
      const filteredRects = updatedRects.filter(r => !idsToDelete.has(r.id));
      
      setShouldUpdateLayout(true);
      return filteredRects;
    });
    
    setSelectedRect(null);
    setEditingRect(null);
  }, []);

  // 添加更新节点高度的方法
  const updateNodeHeight = useCallback((id, height) => {
    setRectangles(prev => {
      // 检查高度是否有实质性变化，避免不必要的更新
      const node = prev.find(r => r.id === id);
      if (!node || Math.abs(node.height - height) < 10) {
        return prev;
      }

      const updatedRects = prev.map(rect => {
        if (rect.id === id) {
          // 创建节点的副本并更新高度
          const updatedRect = {...rect, height};
          return updatedRect;
        }
        return rect;
      });
      
      // 使用防抖函数触发布局更新
      debouncedLayoutUpdate();
      return updatedRects;
    });
  }, [debouncedLayoutUpdate]);

  // 添加更新节点宽度的方法
  const updateNodeWidth = useCallback((id, width) => {
    setRectangles(prev => {
      // 检查宽度是否有实质性变化，避免不必要的更新
      const node = prev.find(r => r.id === id);
      if (!node || Math.abs(node.width - width) < 10) {
        return prev;
      }

      const updatedRects = prev.map(rect => {
        if (rect.id === id) {
          // 创建节点的副本并更新宽度
          const updatedRect = {...rect};
          // 确保宽度在最小和最大范围内
          updatedRect.width = Math.min(Math.max(width, 200), 600);
          return updatedRect;
        }
        return rect;
      });
      
      // 使用防抖函数触发布局更新
      debouncedLayoutUpdate();
      return updatedRects;
    });
  }, [debouncedLayoutUpdate]);

  return {
    rectangles,
    selectedRect,
    editingRect,
    setSelectedRect,
    setEditingRect,
    addNode,
    updateNodeText,
    deleteNode,
    updateNodeHeight,
    updateNodeWidth
  };
};