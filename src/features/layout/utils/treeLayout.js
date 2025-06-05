import * as d3 from 'd3';
import { DEFAULT_LAYOUT_CONFIG } from '../config/layoutConfig';

// 创建布局管理器类
export class TreeLayoutManager {
  constructor(options = DEFAULT_LAYOUT_CONFIG) {
    // 默认配置
    this.config = {
      minNodeDistance: options.minNodeDistance || 80, // 同级节点之间的最小垂直距离
      minHorizontalGap: options.minHorizontalGap || 100, // 最小水平间隙
      questionAnswerGap: options.questionAnswerGap || 150, // 问答节点之间的间隙
      siblingGap: options.siblingGap || 100, // 兄弟节点之间的间隙
      defaultNodeWidth: options.defaultNodeWidth || 200, // 默认节点宽度
      defaultNodeHeight: options.defaultNodeHeight || 100, // 默认节点高度
      ...options
    };
    
    // 缓存上次计算的结果
    this.lastNodes = null;
    this.lastResult = null;
    this.lastConfig = JSON.stringify(this.config);
  }

  /**
   * 更新布局配置
   * @param {Object} newConfig - 新的配置参数
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig
    };
    // 配置变更，清除缓存
    this.lastConfig = JSON.stringify(this.config);
    this.lastNodes = null;
    this.lastResult = null;
  }

  /**
   * 检查是否需要重新计算布局
   * @param {Array} nodes - 节点数组
   * @returns {boolean} - 是否需要重新计算
   */
  needsRecalculation(nodes) {
    // 如果没有缓存结果，需要重新计算
    if (!this.lastNodes || !this.lastResult) return true;
    
    // 如果节点数量不同，需要重新计算
    if (nodes.length !== this.lastNodes.length) return true;
    
    // 如果配置变更，需要重新计算
    if (this.lastConfig !== JSON.stringify(this.config)) return true;
    
    // 检查节点是否有变化
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const lastNode = this.lastNodes.find(n => n.id === node.id);
      
      // 如果找不到对应节点，需要重新计算
      if (!lastNode) return true;
      
      // 检查关键属性是否变化
      if (
        lastNode.parentId !== node.parentId ||
        lastNode.width !== node.width ||
        lastNode.height !== node.height ||
        JSON.stringify(lastNode.childrenIds) !== JSON.stringify(node.childrenIds) ||
        lastNode.text !== node.text // 检查文本内容变化，可能影响节点高度
      ) {
        return true;
      }
    }
    
    // 没有变化，不需要重新计算
    return false;
  }

  // 计算树形布局
  calculateLayout(nodes) {
    if (!nodes || nodes.length === 0) {
      return nodes;
    }
    
    // 检查是否需要重新计算
    if (!this.needsRecalculation(nodes)) {
      console.log('使用缓存的布局结果');
      // 更新节点位置，但保持布局不变
      return nodes.map(node => {
        const cachedNode = this.lastResult.find(n => n.id === node.id);
        if (cachedNode) {
          return { ...node, x: cachedNode.x, y: cachedNode.y };
        }
        return node;
      });
    }
    
    console.log('重新计算布局');
    
    // 创建层次结构数据
    const stratify = d3.stratify()
      .id(d => d.id)
      .parentId(d => d.parentId);

    // 将扁平数组转换为层次结构
    let root;
    try {
      root = stratify(nodes);
    } catch (e) {
      console.error('创建层次结构失败:', e);
      return nodes;
    }

    // 为每个节点添加尺寸信息
    root.each(node => {
      const originalNode = nodes.find(n => n.id.toString() === node.id);
      if (originalNode) {
        node.width = originalNode.width || this.config.defaultNodeWidth;
        node.height = originalNode.height || this.config.defaultNodeHeight;
        node.type = originalNode.type; // 保存节点类型
      } else {
        node.width = this.config.defaultNodeWidth;
        node.height = this.config.defaultNodeHeight;
      }
    });

    // 创建树形布局
    const treeLayout = d3.tree()
      .nodeSize([0, 0]) // 初始设置为0，后面会根据实际节点尺寸调整
      .separation((a, b) => {
        // 根据节点高度动态计算分离度
        const heightFactor = (a.height + b.height) / 2 / 100 + 1.2;
        return (a.parent === b.parent ? 1.2 : 1.8) * heightFactor;
      });

    // 计算初始布局
    treeLayout(root);

    // 第一次遍历：计算每个节点所需的水平空间
    this._calculateHorizontalSpace(root, nodes);

    // 第二次遍历：调整节点位置，考虑实际节点尺寸
    this._adjustHorizontalPositions(root, nodes);

    // 调整垂直位置，避免节点重叠
    this._adjustVerticalPositions(root);

    // 向下传播垂直位置调整
    this._propagateVerticalAdjustments(root);

    // 将计算后的坐标转换回原始数据格式
    const updatedNodes = nodes.map(node => {
      const treeNode = root.find(d => d.id === node.id.toString());
      if (treeNode) {
        return {
          ...node,
          x: treeNode.y, // d3.tree 的 x 和 y 是相反的，所以这里交换
          y: treeNode.x
        };
      }
      return node;
    });
    
    // 缓存计算结果
    this.lastNodes = JSON.parse(JSON.stringify(nodes));
    this.lastResult = JSON.parse(JSON.stringify(updatedNodes));
    this.lastConfig = JSON.stringify(this.config);

    return updatedNodes;
  }

  // 计算每个节点所需的水平空间
  _calculateHorizontalSpace(node, allNodes) {
    if (!node) return 0;
    
    // 获取原始节点数据
    const originalNode = allNodes.find(n => n.id.toString() === node.id);
    const nodeWidth = originalNode ? originalNode.width : this.config.defaultNodeWidth;
    
    // 如果没有子节点，返回当前节点宽度
    if (!node.children || node.children.length === 0) {
      node.requiredWidth = nodeWidth;
      return nodeWidth;
    }
    
    // 递归计算所有子节点所需的空间
    let childrenWidth = 0;
    node.children.forEach(child => {
      childrenWidth += this._calculateHorizontalSpace(child, allNodes);
    });
    
    // 节点所需的宽度是其自身宽度和子节点宽度的最大值
    node.requiredWidth = Math.max(nodeWidth, childrenWidth);
    return node.requiredWidth;
  }

  // 调整水平位置
  _adjustHorizontalPositions(root, allNodes) {
    // 按深度从小到大处理节点
    const maxDepth = Math.max(...Array.from(root.descendants(), node => node.depth));
    
    for (let depth = 0; depth <= maxDepth; depth++) {
      const nodesAtDepth = root.descendants().filter(node => node.depth === depth);
      
      for (const node of nodesAtDepth) {
        // 获取原始节点数据
        const originalNode = allNodes.find(n => n.id.toString() === node.id);
        const nodeWidth = originalNode ? originalNode.width : this.config.defaultNodeWidth;
        
        // 如果是根节点，设置初始位置
        if (depth === 0) {
          node.y = 0;
        }
        
        // 处理子节点的水平位置
        if (node.children && node.children.length > 0) {
          // 计算父节点右边缘位置
          const parentRightEdge = node.y + nodeWidth;
          
          // 为每个子节点设置水平位置
          node.children.forEach(child => {
            // 获取子节点的原始数据
            const childOriginal = allNodes.find(n => n.id.toString() === child.id);
            const childWidth = childOriginal ? childOriginal.width : this.config.defaultNodeWidth;
            
            // 计算子节点与父节点之间的最小间距
            // 对于问答对，使用更大的间距
            let horizontalGap = this.config.minHorizontalGap;
            if (originalNode && childOriginal) {
              if ((originalNode.type === 'question' && childOriginal.type === 'answer') ||
                  (originalNode.type === 'answer' && childOriginal.type === 'question')) {
                horizontalGap = Math.max(this.config.minHorizontalGap, nodeWidth / 4 + this.config.questionAnswerGap);
              } else {
                horizontalGap = Math.max(this.config.minHorizontalGap, nodeWidth / 4 + this.config.siblingGap);
              }
            }
            
            // 设置子节点的水平位置
            child.y = parentRightEdge + horizontalGap;
          });
        }
      }
    }
  }

  // 调整垂直位置，避免节点重叠
  _adjustVerticalPositions(root) {
    // 按深度分组节点
    const nodesByDepth = {};
    root.each(node => {
      if (!nodesByDepth[node.depth]) {
        nodesByDepth[node.depth] = [];
      }
      nodesByDepth[node.depth].push(node);
    });

    // 对每个深度层级的节点进行垂直位置调整
    Object.keys(nodesByDepth).sort((a, b) => Number(a) - Number(b)).forEach(depth => {
      const nodes = nodesByDepth[depth];
      
      // 按垂直位置排序
      nodes.sort((a, b) => a.x - b.x);
      
      // 调整位置避免重叠
      for (let i = 1; i < nodes.length; i++) {
        const current = nodes[i];
        const previous = nodes[i - 1];
        
        // 计算所需的最小间距，考虑节点高度和额外的间距
        // 使用更大的基础间距，并根据节点高度动态调整
        const heightFactor = Math.max(1.2, (previous.height + current.height) / 200);
        const requiredGap = (previous.height / 2) + (current.height / 2) + (this.config.minNodeDistance * heightFactor * 1.5);
        
        // 如果间距不足，向下移动当前节点及其子树
        if (current.x - previous.x < requiredGap) {
          const offset = requiredGap - (current.x - previous.x);
          this._shiftSubtree(current, offset);
        }
      }
    });
  }

  // 向下传播垂直位置调整，确保父节点的变化影响子节点
  _propagateVerticalAdjustments(root) {
    // 按深度从小到大处理，确保父节点的调整先于子节点
    const maxDepth = Math.max(...Array.from(root.descendants(), node => node.depth));
    
    for (let depth = 0; depth < maxDepth; depth++) {
      const nodesAtDepth = root.descendants().filter(node => node.depth === depth);
      
      for (const node of nodesAtDepth) {
        if (node.children && node.children.length > 0) {
          // 计算子节点的垂直中心
          const childrenCenter = node.children.reduce((sum, child) => sum + child.x, 0) / node.children.length;
          
          // 如果父节点和子节点中心不对齐，调整子节点位置
          if (Math.abs(node.x - childrenCenter) > 1) {
            const offset = node.x - childrenCenter;
            
            // 移动所有子节点及其子树
            node.children.forEach(child => {
              this._shiftSubtree(child, offset);
            });
          }
          
          // 确保子节点之间没有重叠
          node.children.sort((a, b) => a.x - b.x);
          for (let i = 1; i < node.children.length; i++) {
            const current = node.children[i];
            const previous = node.children[i - 1];
            
            // 使用更大的基础间距，并根据节点高度动态调整
            const heightFactor = Math.max(1.2, (previous.height + current.height) / 200);
            const requiredGap = (previous.height / 2) + (current.height / 2) + (this.config.minNodeDistance * heightFactor * 1.5);
            
            if (current.x - previous.x < requiredGap) {
              const offset = requiredGap - (current.x - previous.x);
              this._shiftSubtree(current, offset);
            }
          }
        }
      }
    }
    
    // 第二次传播：自底向上确保所有子树之间没有重叠
    for (let depth = maxDepth - 1; depth >= 0; depth--) {
      const nodesAtDepth = root.descendants().filter(node => node.depth === depth);
      
      for (const node of nodesAtDepth) {
        if (node.children && node.children.length > 0) {
          // 检查子树之间是否有重叠
          this._checkAndAdjustSubtreeOverlap(node.children);
        }
      }
    }
  }

  // 检查并调整子树之间的重叠
  _checkAndAdjustSubtreeOverlap(siblings) {
    if (!siblings || siblings.length <= 1) return;
    
    // 按垂直位置排序
    siblings.sort((a, b) => a.x - b.x);
    
    // 获取每个子树的边界
    const subtreeBounds = siblings.map(node => {
      const descendants = node.descendants();
      // 增加边界的安全边距
      const minY = Math.min(...descendants.map(d => d.x - d.height / 2)) - this.config.minNodeDistance;
      const maxY = Math.max(...descendants.map(d => d.x + d.height / 2)) + this.config.minNodeDistance;
      return { node, minY, maxY };
    });
    
    // 检查相邻子树之间的重叠
    for (let i = 1; i < subtreeBounds.length; i++) {
      const current = subtreeBounds[i];
      const previous = subtreeBounds[i - 1];
      
      // 如果有重叠，向下移动当前子树
      if (current.minY <= previous.maxY) {
        const offset = previous.maxY - current.minY + this.config.minNodeDistance * 2;
        this._shiftSubtree(current.node, offset);
        
        // 更新当前子树的边界
        const descendants = current.node.descendants();
        current.minY += offset;
        current.maxY += offset;
      }
    }
  }

  // 移动子树
  _shiftSubtree(node, offset) {
    node.x += offset;
    if (node.children) {
      node.children.forEach(child => {
        this._shiftSubtree(child, offset);
      });
    }
  }
}

// 为了向后兼容，保留原来的函数接口
export const calculateTreeLayout = (nodes) => {
  const layoutManager = new TreeLayoutManager();
  return layoutManager.calculateLayout(nodes);
}; 