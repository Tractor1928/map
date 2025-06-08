/**
 * 布局算法类型枚举
 */
export const LAYOUT_ALGORITHM_TYPES = Object.freeze({
  TREE: 'tree',
  FORCE_DIRECTED: 'force-directed',
  RADIAL: 'radial',
  HIERARCHICAL: 'hierarchical',
  CIRCULAR: 'circular',
  GRID: 'grid'
});

/**
 * 节点类型枚举
 */
export const NODE_TYPES = Object.freeze({
  QUESTION: 'question',
  ANSWER: 'answer',
  ROOT: 'root',
  BRANCH: 'branch',
  LEAF: 'leaf'
});

/**
 * 布局方向枚举
 */
export const LAYOUT_DIRECTIONS = Object.freeze({
  TOP_TO_BOTTOM: 'topToBottom',
  BOTTOM_TO_TOP: 'bottomToTop',
  LEFT_TO_RIGHT: 'leftToRight',
  RIGHT_TO_LEFT: 'rightToLeft'
});

/**
 * 布局状态枚举
 */
export const LAYOUT_STATUS = Object.freeze({
  IDLE: 'idle',
  CALCULATING: 'calculating',
  COMPLETED: 'completed',
  ERROR: 'error'
});

/**
 * 默认配置常量
 */
export const DEFAULT_CONFIG = Object.freeze({
  // 节点间距
  minNodeDistance: 80,
  nodeHorizontalGap: 120,
  nodeVerticalGap: 60,
  
  // 节点尺寸
  defaultNodeWidth: 200,
  defaultNodeHeight: 100,
  minNodeWidth: 100,
  maxNodeWidth: 600,
  minNodeHeight: 60,
  maxNodeHeight: 400,
  
  // 布局参数
  direction: LAYOUT_DIRECTIONS.LEFT_TO_RIGHT,
  algorithm: LAYOUT_ALGORITHM_TYPES.TREE,
  
  // 动画参数
  animationDuration: 300,
  enableAnimation: true,
  
  // 性能优化
  enableCache: true,
  cacheTimeout: 5000,
  maxNodes: 1000
}); 