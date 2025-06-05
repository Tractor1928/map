/**
 * 布局配置参数
 * 这些参数控制节点在画布上的布局方式
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
    ...DEFAULT_LAYOUT_CONFIG,
    ...customConfig
  };
}; 