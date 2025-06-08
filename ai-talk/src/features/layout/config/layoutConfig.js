import { DEFAULT_CONFIG, LAYOUT_ALGORITHM_TYPES, LAYOUT_DIRECTIONS } from '../types/LayoutTypes.js';

/**
 * 布局配置参数
 * 这些参数控制节点在画布上的布局方式
 * @deprecated 使用 DEFAULT_CONFIG 替代
 */
export const DEFAULT_LAYOUT_CONFIG = {
  // 同级节点之间的最小垂直距离
  minNodeDistance: 80,
  
  // 节点之间的最小水平间隙
  minHorizontalGap: 40,
  
  // 问题和回答节点之间的水平间隙
  questionAnswerGap: 70,
  
  // 同类型兄弟节点之间的水平间隙
  siblingGap: 40,
  
  // 节点的最小宽度
  minNodeWidth: 200,
  
  // 节点的最大宽度
  maxNodeWidth: 600,
  
  // 节点的最小高度
  minNodeHeight: 100,
  
  // 节点的默认高度
  defaultNodeHeight: 100,
  
  // 节点的默认宽度
  defaultNodeWidth: 200,
  
  // 节点内边距
  nodePadding: 10,
  
  // 节点字体大小
  nodeFontSize: 14,
  
  // 节点字体
  nodeFontFamily: 'Arial'
};

/**
 * 创建自定义布局配置
 * @param {Object} customConfig - 自定义配置参数
 * @returns {Object} - 合并后的配置参数
 */
export const createLayoutConfig = (customConfig = {}) => {
  return {
    ...DEFAULT_CONFIG,
    ...customConfig
  };
};

/**
 * 验证布局配置
 * @param {Object} config - 配置对象
 * @returns {Object} - 验证结果 {valid: boolean, errors: string[]}
 */
export const validateLayoutConfig = (config) => {
  const errors = [];
  
  // 验证数值类型的配置
  const numericFields = [
    'minNodeDistance', 'nodeHorizontalGap', 'nodeVerticalGap',
    'defaultNodeWidth', 'defaultNodeHeight', 'minNodeWidth', 
    'maxNodeWidth', 'minNodeHeight', 'maxNodeHeight'
  ];
  
  numericFields.forEach(field => {
    if (config[field] !== undefined && (typeof config[field] !== 'number' || config[field] < 0)) {
      errors.push(`${field} 必须是非负数`);
    }
  });
  
  // 验证枚举类型的配置
  if (config.algorithm && !Object.values(LAYOUT_ALGORITHM_TYPES).includes(config.algorithm)) {
    errors.push('无效的布局算法类型');
  }
  
  if (config.direction && !Object.values(LAYOUT_DIRECTIONS).includes(config.direction)) {
    errors.push('无效的布局方向');
  }
  
  // 验证尺寸约束
  if (config.minNodeWidth && config.maxNodeWidth && config.minNodeWidth > config.maxNodeWidth) {
    errors.push('最小节点宽度不能大于最大节点宽度');
  }
  
  if (config.minNodeHeight && config.maxNodeHeight && config.minNodeHeight > config.maxNodeHeight) {
    errors.push('最小节点高度不能大于最大节点高度');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}; 