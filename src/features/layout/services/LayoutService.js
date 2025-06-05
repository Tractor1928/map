import { TreeLayoutManager } from '../utils/treeLayout';
import { DEFAULT_LAYOUT_CONFIG, createLayoutConfig } from '../config/layoutConfig';

/**
 * 布局类型枚举
 */
export const LAYOUT_TYPES = Object.freeze({
  TREE: 'tree',
  FORCE: 'force',
  RADIAL: 'radial',
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
});

/**
 * 布局服务类
 * 用于管理不同类型的布局算法
 */
export class LayoutService {
  constructor(config = DEFAULT_LAYOUT_CONFIG) {
    this.config = createLayoutConfig(config);
    this.layoutManagers = {
      [LAYOUT_TYPES.TREE]: new TreeLayoutManager(this.config)
      // 未来可以添加更多布局类型
      // [LAYOUT_TYPES.FORCE]: new ForceLayoutManager(this.config),
      // [LAYOUT_TYPES.RADIAL]: new RadialLayoutManager(this.config),
      // 等等
    };
    this.currentLayoutType = LAYOUT_TYPES.TREE;
  }

  /**
   * 设置布局类型
   * @param {string} layoutType - 布局类型
   */
  setLayoutType(layoutType) {
    if (this.layoutManagers[layoutType]) {
      this.currentLayoutType = layoutType;
    } else {
      console.error(`布局类型 ${layoutType} 不存在`);
    }
  }

  /**
   * 更新布局配置
   * @param {Object} config - 新的配置参数
   */
  updateConfig(config) {
    this.config = createLayoutConfig({
      ...this.config,
      ...config
    });
    
    // 更新所有布局管理器的配置
    Object.keys(this.layoutManagers).forEach(key => {
      if (this.layoutManagers[key].updateConfig) {
        this.layoutManagers[key].updateConfig(this.config);
      }
    });
  }

  /**
   * 计算节点布局
   * @param {Array} nodes - 节点数组
   * @param {string} layoutType - 可选，指定布局类型
   * @returns {Array} - 更新后的节点数组
   */
  calculateLayout(nodes, layoutType = null) {
    const type = layoutType || this.currentLayoutType;
    const layoutManager = this.layoutManagers[type];
    
    if (!layoutManager) {
      console.error(`布局类型 ${type} 不存在`);
      return nodes;
    }
    
    return layoutManager.calculateLayout(nodes);
  }

  /**
   * 获取当前布局配置
   * @returns {Object} - 当前布局配置
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * 获取可用的布局类型
   * @returns {Array} - 可用布局类型数组
   */
  getAvailableLayoutTypes() {
    return Object.keys(this.layoutManagers);
  }

  /**
   * 获取当前布局类型
   * @returns {string} - 当前布局类型
   */
  getCurrentLayoutType() {
    return this.currentLayoutType;
  }
}

// 创建默认布局服务实例
export const defaultLayoutService = new LayoutService(); 