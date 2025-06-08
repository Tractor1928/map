/**
 * 简单树形布局算法
 * 作为后备方案的简化布局实现
 */
export class SimpleTreeLayout {
  constructor(config = {}) {
    this.config = {
      nodeHorizontalGap: 120,
      nodeVerticalGap: 80,
      defaultNodeWidth: 200,
      defaultNodeHeight: 100,
      ...config
    };
  }

  /**
   * 计算布局
   * @param {Array} nodes - 节点数组
   * @returns {Array} - 计算后的节点数组
   */
  calculateLayout(nodes) {
    if (!nodes || nodes.length === 0) {
      return nodes || [];
    }

    // 构建树形结构
    const tree = this.buildTree(nodes);
    
    if (!tree.root) {
      // 如果没有根节点，创建一个简单的网格布局
      return this.createGridLayout(nodes);
    }

    // 计算树形布局
    this.calculateTreePositions(tree.root, 0, 0);

    // 提取结果
    return this.extractNodes(tree);
  }

  /**
   * 构建树形结构
   * @param {Array} nodes - 节点数组
   * @returns {Object} - 树形结构
   */
  buildTree(nodes) {
    const nodeMap = new Map();
    let root = null;

    // 创建节点映射
    nodes.forEach(node => {
      nodeMap.set(node.id, {
        ...node,
        children: []
      });
    });

    // 建立父子关系
    nodes.forEach(node => {
      if (!node.parentId) {
        root = nodeMap.get(node.id);
      } else {
        const parent = nodeMap.get(node.parentId);
        const child = nodeMap.get(node.id);
        if (parent && child) {
          parent.children.push(child);
        }
      }
    });

    return { root, nodeMap };
  }

  /**
   * 计算树形位置
   * @param {Object} node - 节点
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  calculateTreePositions(node, x, y) {
    if (!node) return;

    node.x = x;
    node.y = y;

    const childCount = node.children.length;
    if (childCount === 0) return;

    const startY = y - ((childCount - 1) * this.config.nodeVerticalGap) / 2;
    
    node.children.forEach((child, index) => {
      const childX = x + node.width + this.config.nodeHorizontalGap;
      const childY = startY + index * this.config.nodeVerticalGap;
      
      this.calculateTreePositions(child, childX, childY);
    });
  }

  /**
   * 创建网格布局（后备方案）
   * @param {Array} nodes - 节点数组
   * @returns {Array} - 布局后的节点数组
   */
  createGridLayout(nodes) {
    const result = [];
    const cols = Math.ceil(Math.sqrt(nodes.length));
    
    nodes.forEach((node, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      
      result.push({
        ...node,
        x: col * (this.config.defaultNodeWidth + this.config.nodeHorizontalGap),
        y: row * (this.config.defaultNodeHeight + this.config.nodeVerticalGap)
      });
    });

    return result;
  }

  /**
   * 提取节点数组
   * @param {Object} tree - 树形结构
   * @returns {Array} - 节点数组
   */
  extractNodes(tree) {
    const nodes = [];
    
    tree.nodeMap.forEach(node => {
      const { children, ...cleanNode } = node;
      
      // 确保坐标存在
      if (typeof cleanNode.x !== 'number') cleanNode.x = 0;
      if (typeof cleanNode.y !== 'number') cleanNode.y = 0;
      
      nodes.push(cleanNode);
    });

    return nodes;
  }

  /**
   * 更新配置
   * @param {Object} config - 新配置
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };
  }
} 