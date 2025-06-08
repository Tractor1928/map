import { LAYOUT_DIRECTIONS } from '../types/LayoutTypes.js';

/**
 * 节点位置计算器
 * 负责计算节点在画布上的位置
 */
export class NodePositionCalculator {
  constructor(config) {
    this.config = config;
  }

  /**
   * 计算节点相对位置
   * @param {Object} parentNode - 父节点
   * @param {Object} childNode - 子节点
   * @param {number} index - 子节点索引
   * @param {number} totalSiblings - 兄弟节点总数
   * @returns {Object} - 相对位置 {x, y}
   */
  calculateRelativePosition(parentNode, childNode, index, totalSiblings) {
    const direction = this.config.direction || LAYOUT_DIRECTIONS.LEFT_TO_RIGHT;
    
    switch (direction) {
      case LAYOUT_DIRECTIONS.LEFT_TO_RIGHT:
        return this._calculateLeftToRight(parentNode, childNode, index, totalSiblings);
      case LAYOUT_DIRECTIONS.TOP_TO_BOTTOM:
        return this._calculateTopToBottom(parentNode, childNode, index, totalSiblings);
      case LAYOUT_DIRECTIONS.RIGHT_TO_LEFT:
        return this._calculateRightToLeft(parentNode, childNode, index, totalSiblings);
      case LAYOUT_DIRECTIONS.BOTTOM_TO_TOP:
        return this._calculateBottomToTop(parentNode, childNode, index, totalSiblings);
      default:
        return this._calculateLeftToRight(parentNode, childNode, index, totalSiblings);
    }
  }

  /**
   * 从左到右布局计算
   */
  _calculateLeftToRight(parentNode, childNode, index, totalSiblings) {
    const horizontalGap = this.config.nodeHorizontalGap || 120;
    const verticalGap = this.config.nodeVerticalGap || 60;
    
    // 计算水平位置：父节点右边缘 + 间距
    const x = parentNode.x + parentNode.width + horizontalGap;
    
    // 计算垂直位置：居中分布
    const totalHeight = (totalSiblings - 1) * verticalGap;
    const startY = parentNode.y + parentNode.height / 2 - totalHeight / 2;
    const y = startY + index * verticalGap;
    
    return { x, y };
  }

  /**
   * 从上到下布局计算
   */
  _calculateTopToBottom(parentNode, childNode, index, totalSiblings) {
    const horizontalGap = this.config.nodeHorizontalGap || 120;
    const verticalGap = this.config.nodeVerticalGap || 60;
    
    // 计算垂直位置：父节点下边缘 + 间距
    const y = parentNode.y + parentNode.height + verticalGap;
    
    // 计算水平位置：居中分布
    const totalWidth = (totalSiblings - 1) * horizontalGap;
    const startX = parentNode.x + parentNode.width / 2 - totalWidth / 2;
    const x = startX + index * horizontalGap;
    
    return { x, y };
  }

  /**
   * 从右到左布局计算
   */
  _calculateRightToLeft(parentNode, childNode, index, totalSiblings) {
    const horizontalGap = this.config.nodeHorizontalGap || 120;
    const verticalGap = this.config.nodeVerticalGap || 60;
    
    // 计算水平位置：父节点左边缘 - 间距 - 子节点宽度
    const x = parentNode.x - horizontalGap - childNode.width;
    
    // 计算垂直位置：居中分布
    const totalHeight = (totalSiblings - 1) * verticalGap;
    const startY = parentNode.y + parentNode.height / 2 - totalHeight / 2;
    const y = startY + index * verticalGap;
    
    return { x, y };
  }

  /**
   * 从下到上布局计算
   */
  _calculateBottomToTop(parentNode, childNode, index, totalSiblings) {
    const horizontalGap = this.config.nodeHorizontalGap || 120;
    const verticalGap = this.config.nodeVerticalGap || 60;
    
    // 计算垂直位置：父节点上边缘 - 间距 - 子节点高度
    const y = parentNode.y - verticalGap - childNode.height;
    
    // 计算水平位置：居中分布
    const totalWidth = (totalSiblings - 1) * horizontalGap;
    const startX = parentNode.x + parentNode.width / 2 - totalWidth / 2;
    const x = startX + index * horizontalGap;
    
    return { x, y };
  }

  /**
   * 计算节点中心点
   * @param {Object} node - 节点对象
   * @returns {Object} - 中心点坐标 {x, y}
   */
  calculateCenter(node) {
    return {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2
    };
  }

  /**
   * 计算两节点之间的距离
   * @param {Object} node1 - 节点1
   * @param {Object} node2 - 节点2
   * @returns {number} - 距离
   */
  calculateDistance(node1, node2) {
    const center1 = this.calculateCenter(node1);
    const center2 = this.calculateCenter(node2);
    
    return Math.sqrt(
      Math.pow(center2.x - center1.x, 2) + 
      Math.pow(center2.y - center1.y, 2)
    );
  }

  /**
   * 更新配置
   * @param {Object} config - 新的配置
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };
  }
} 