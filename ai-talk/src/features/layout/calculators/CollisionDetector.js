/**
 * 碰撞检测器
 * 负责检测节点重叠并提供解决方案
 */
export class CollisionDetector {
  constructor(config) {
    this.config = config;
  }

  /**
   * 检测两个节点是否重叠
   * @param {Object} node1 - 节点1
   * @param {Object} node2 - 节点2
   * @param {number} padding - 额外的间距
   * @returns {boolean} - 是否重叠
   */
  isOverlapping(node1, node2, padding = 0) {
    const margin = padding || this.config.minNodeDistance || 10;
    
    return !(
      node1.x + node1.width + margin <= node2.x ||
      node2.x + node2.width + margin <= node1.x ||
      node1.y + node1.height + margin <= node2.y ||
      node2.y + node2.height + margin <= node1.y
    );
  }

  /**
   * 检测节点与节点组是否重叠
   * @param {Object} node - 目标节点
   * @param {Array} nodeGroup - 节点组
   * @param {number} padding - 额外间距
   * @returns {Array} - 重叠的节点列表
   */
  findOverlappingNodes(node, nodeGroup, padding = 0) {
    return nodeGroup.filter(otherNode => 
      otherNode.id !== node.id && 
      this.isOverlapping(node, otherNode, padding)
    );
  }

  /**
   * 检测所有节点的重叠情况
   * @param {Array} nodes - 所有节点
   * @returns {Array} - 重叠对列表 [{node1, node2, overlapArea}]
   */
  detectAllOverlaps(nodes) {
    const overlaps = [];
    const processed = new Set();

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        const pairKey = `${Math.min(node1.id, node2.id)}-${Math.max(node1.id, node2.id)}`;

        if (processed.has(pairKey)) continue;
        processed.add(pairKey);

        if (this.isOverlapping(node1, node2)) {
          overlaps.push({
            node1,
            node2,
            overlapArea: this.calculateOverlapArea(node1, node2)
          });
        }
      }
    }

    return overlaps;
  }

  /**
   * 计算重叠面积
   * @param {Object} node1 - 节点1
   * @param {Object} node2 - 节点2
   * @returns {number} - 重叠面积
   */
  calculateOverlapArea(node1, node2) {
    const xOverlap = Math.max(0, 
      Math.min(node1.x + node1.width, node2.x + node2.width) - 
      Math.max(node1.x, node2.x)
    );
    
    const yOverlap = Math.max(0,
      Math.min(node1.y + node1.height, node2.y + node2.height) - 
      Math.max(node1.y, node2.y)
    );

    return xOverlap * yOverlap;
  }

  /**
   * 计算解决重叠的最小移动距离
   * @param {Object} node1 - 节点1
   * @param {Object} node2 - 节点2
   * @param {string} direction - 移动方向 ('horizontal' | 'vertical' | 'both')
   * @returns {Object} - 移动向量 {x, y}
   */
  calculateSeparationVector(node1, node2, direction = 'both') {
    const margin = this.config.minNodeDistance || 10;
    
    // 计算节点中心点
    const center1 = {
      x: node1.x + node1.width / 2,
      y: node1.y + node1.height / 2
    };
    const center2 = {
      x: node2.x + node2.width / 2,
      y: node2.y + node2.height / 2
    };

    // 计算需要的最小分离距离
    const requiredDistanceX = (node1.width + node2.width) / 2 + margin;
    const requiredDistanceY = (node1.height + node2.height) / 2 + margin;

    // 计算当前距离
    const currentDistanceX = Math.abs(center2.x - center1.x);
    const currentDistanceY = Math.abs(center2.y - center1.y);

    let separationX = 0;
    let separationY = 0;

    if (direction === 'horizontal' || direction === 'both') {
      if (currentDistanceX < requiredDistanceX) {
        separationX = requiredDistanceX - currentDistanceX;
        if (center2.x < center1.x) separationX *= -1;
      }
    }

    if (direction === 'vertical' || direction === 'both') {
      if (currentDistanceY < requiredDistanceY) {
        separationY = requiredDistanceY - currentDistanceY;
        if (center2.y < center1.y) separationY *= -1;
      }
    }

    return { x: separationX, y: separationY };
  }

  /**
   * 为子树检测边界重叠
   * @param {Array} subtree1 - 子树1的所有节点
   * @param {Array} subtree2 - 子树2的所有节点
   * @returns {boolean} - 是否有重叠
   */
  hasSubtreeOverlap(subtree1, subtree2) {
    for (const node1 of subtree1) {
      for (const node2 of subtree2) {
        if (this.isOverlapping(node1, node2)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 计算子树边界
   * @param {Array} subtree - 子树节点数组
   * @returns {Object} - 边界 {left, right, top, bottom}
   */
  calculateSubtreeBounds(subtree) {
    if (!subtree || subtree.length === 0) {
      return { left: 0, right: 0, top: 0, bottom: 0 };
    }

    const bounds = {
      left: Math.min(...subtree.map(n => n.x)),
      right: Math.max(...subtree.map(n => n.x + n.width)),
      top: Math.min(...subtree.map(n => n.y)),
      bottom: Math.max(...subtree.map(n => n.y + n.height))
    };

    return bounds;
  }

  /**
   * 计算子树分离向量
   * @param {Array} subtree1 - 子树1
   * @param {Array} subtree2 - 子树2
   * @returns {Object} - 分离向量 {x, y}
   */
  calculateSubtreeSeparation(subtree1, subtree2) {
    const bounds1 = this.calculateSubtreeBounds(subtree1);
    const bounds2 = this.calculateSubtreeBounds(subtree2);
    const margin = this.config.minNodeDistance || 10;

    let separationX = 0;
    let separationY = 0;

    // 水平分离
    if (bounds1.right + margin > bounds2.left && bounds1.left < bounds2.right + margin) {
      const overlapX = Math.min(bounds1.right, bounds2.right) - Math.max(bounds1.left, bounds2.left);
      separationX = overlapX + margin;
      
      // 决定移动方向
      const center1X = (bounds1.left + bounds1.right) / 2;
      const center2X = (bounds2.left + bounds2.right) / 2;
      if (center2X < center1X) separationX *= -1;
    }

    // 垂直分离
    if (bounds1.bottom + margin > bounds2.top && bounds1.top < bounds2.bottom + margin) {
      const overlapY = Math.min(bounds1.bottom, bounds2.bottom) - Math.max(bounds1.top, bounds2.top);
      separationY = overlapY + margin;
      
      // 决定移动方向
      const center1Y = (bounds1.top + bounds1.bottom) / 2;
      const center2Y = (bounds2.top + bounds2.bottom) / 2;
      if (center2Y < center1Y) separationY *= -1;
    }

    return { x: separationX, y: separationY };
  }

  /**
   * 更新配置
   * @param {Object} config - 新的配置
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };
  }
} 