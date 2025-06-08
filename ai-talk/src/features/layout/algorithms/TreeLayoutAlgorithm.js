import { ILayoutAlgorithm } from '../interfaces/ILayoutAlgorithm.js';
import { NodePositionCalculator } from '../calculators/NodePositionCalculator.js';
import { CollisionDetector } from '../calculators/CollisionDetector.js';
import { LAYOUT_DIRECTIONS } from '../types/LayoutTypes.js';

/**
 * 树形布局算法
 * 基于层次结构的简洁布局算法
 */
export class TreeLayoutAlgorithm extends ILayoutAlgorithm {
  constructor(config) {
    super(config);
    this.positionCalculator = new NodePositionCalculator(config);
    this.collisionDetector = new CollisionDetector(config);
  }

  /**
   * 计算布局
   * @param {Array} nodes - 节点数组
   * @returns {Promise<Array>} - 计算后的节点数组
   */
  async calculate(nodes) {
    if (!nodes || nodes.length === 0) {
      return nodes;
    }

    // 验证节点数据
    if (!this.validateNodes(nodes)) {
      throw new Error('节点数据验证失败');
    }

    // 构建树形结构
    const tree = this.buildTree(nodes);
    if (!tree.root) {
      throw new Error('未找到根节点');
    }

    // 初始化节点位置
    this.initializePositions(tree);

    // 计算各层级的布局
    await this.calculateTreeLayout(tree);

    // 检测并解决冲突
    this.resolveCollisions(tree);

    // 返回更新后的节点数组
    return this.extractNodes(tree);
  }

  /**
   * 构建树形结构
   * @param {Array} nodes - 节点数组
   * @returns {Object} - 树形结构 {root, nodeMap, levels}
   */
  buildTree(nodes) {
    const nodeMap = new Map();
    const children = new Map();
    let root = null;

    // 创建节点映射
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node });
      children.set(node.id, []);
    });

    // 建立父子关系
    nodes.forEach(node => {
      if (!node.parentId) {
        root = nodeMap.get(node.id);
      } else {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          children.get(node.parentId).push(nodeMap.get(node.id));
        }
      }
    });

    // 为每个节点添加子节点引用
    nodeMap.forEach((node, id) => {
      node.children = children.get(id) || [];
    });

    // 计算层级
    const levels = this.calculateLevels(root);

    return { root, nodeMap, levels };
  }

  /**
   * 计算节点层级
   * @param {Object} root - 根节点
   * @returns {Array} - 按层级分组的节点数组
   */
  calculateLevels(root) {
    const levels = [];
    
    const traverse = (node, level) => {
      if (!levels[level]) {
        levels[level] = [];
      }
      levels[level].push(node);
      node.level = level;

      node.children.forEach(child => {
        traverse(child, level + 1);
      });
    };

    if (root) {
      traverse(root, 0);
    }

    return levels;
  }

  /**
   * 初始化节点位置
   * @param {Object} tree - 树形结构
   */
  initializePositions(tree) {
    const { root } = tree;
    
    // 设置根节点位置
    root.x = 0;
    root.y = 0;
  }

  /**
   * 计算树形布局
   * @param {Object} tree - 树形结构
   */
  async calculateTreeLayout(tree) {
    const { levels } = tree;

    // 逐层计算位置
    for (let level = 0; level < levels.length; level++) {
      const currentLevelNodes = levels[level];
      
      if (level === 0) {
        // 根节点已经初始化
        continue;
      }

      // 为当前层级的每个节点计算位置
      for (const node of currentLevelNodes) {
        this.calculateNodePosition(node, tree);
      }

      // 调整当前层级节点，避免重叠
      this.adjustLevelNodes(currentLevelNodes);
    }
  }

  /**
   * 计算单个节点的位置
   * @param {Object} node - 节点
   * @param {Object} tree - 树形结构
   */
  calculateNodePosition(node, tree) {
    const parent = this.findParent(node, tree);
    if (!parent) return;

    // 获取兄弟节点
    const siblings = parent.children;
    const siblingIndex = siblings.indexOf(node);

    // 使用位置计算器计算相对位置
    const position = this.positionCalculator.calculateRelativePosition(
      parent,
      node,
      siblingIndex,
      siblings.length
    );

    node.x = position.x;
    node.y = position.y;
  }

  /**
   * 查找父节点
   * @param {Object} node - 子节点
   * @param {Object} tree - 树形结构
   * @returns {Object|null} - 父节点
   */
  findParent(node, tree) {
    if (!node.parentId) return null;
    return tree.nodeMap.get(node.parentId);
  }

  /**
   * 调整同层级节点位置，避免重叠
   * @param {Array} levelNodes - 同层级的节点数组
   */
  adjustLevelNodes(levelNodes) {
    if (levelNodes.length <= 1) return;

    // 按位置排序
    const direction = this.config.direction || LAYOUT_DIRECTIONS.LEFT_TO_RIGHT;
    const isHorizontal = direction === LAYOUT_DIRECTIONS.LEFT_TO_RIGHT || 
                        direction === LAYOUT_DIRECTIONS.RIGHT_TO_LEFT;

    levelNodes.sort((a, b) => {
      return isHorizontal ? a.y - b.y : a.x - b.x;
    });

    // 检测并解决重叠
    for (let i = 1; i < levelNodes.length; i++) {
      const current = levelNodes[i];
      const previous = levelNodes[i - 1];

      if (this.collisionDetector.isOverlapping(previous, current)) {
        const separation = this.collisionDetector.calculateSeparationVector(
          previous, 
          current, 
          isHorizontal ? 'vertical' : 'horizontal'
        );

        // 应用分离向量
        if (isHorizontal) {
          current.y = previous.y + previous.height + Math.abs(separation.y);
        } else {
          current.x = previous.x + previous.width + Math.abs(separation.x);
        }

        // 递归调整受影响的子树
        this.adjustSubtree(current, separation);
      }
    }
  }

  /**
   * 调整子树位置
   * @param {Object} node - 节点
   * @param {Object} offset - 偏移量 {x, y}
   */
  adjustSubtree(node, offset) {
    node.x += offset.x;
    node.y += offset.y;

    // 递归调整子节点
    if (node.children) {
      node.children.forEach(child => {
        this.adjustSubtree(child, offset);
      });
    }
  }

  /**
   * 解决全局冲突
   * @param {Object} tree - 树形结构
   */
  resolveCollisions(tree) {
    const { levels } = tree;
    
    // 多次迭代解决冲突
    let maxIterations = 3;
    let iteration = 0;

    while (iteration < maxIterations) {
      let hasCollision = false;

      for (let level = 1; level < levels.length; level++) {
        const overlaps = this.collisionDetector.detectAllOverlaps(levels[level]);
        
        if (overlaps.length > 0) {
          hasCollision = true;
          this.resolveOverlaps(overlaps);
        }
      }

      if (!hasCollision) break;
      iteration++;
    }
  }

  /**
   * 解决重叠问题
   * @param {Array} overlaps - 重叠对数组
   */
  resolveOverlaps(overlaps) {
    overlaps.forEach(overlap => {
      const { node1, node2 } = overlap;
      const separation = this.collisionDetector.calculateSeparationVector(node1, node2);
      
      // 移动第二个节点
      node2.x += separation.x / 2;
      node2.y += separation.y / 2;
      
      // 同时调整对应的子树
      this.adjustSubtree(node2, { x: separation.x / 2, y: separation.y / 2 });
    });
  }

  /**
   * 提取节点数组
   * @param {Object} tree - 树形结构
   * @returns {Array} - 节点数组
   */
  extractNodes(tree) {
    const nodes = [];
    
    tree.nodeMap.forEach(node => {
      // 移除临时属性，但保留x、y坐标
      const { children, level, ...cleanNode } = node;
      
      // 确保x、y坐标存在
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
    super.updateConfig(config);
    this.positionCalculator.updateConfig(this.config);
    this.collisionDetector.updateConfig(this.config);
  }
} 