import { ILayoutService } from '../interfaces/ILayoutService.js';
import { LayoutCache } from '../utils/LayoutCache.js';
import { DEFAULT_CONFIG, LAYOUT_ALGORITHM_TYPES, LAYOUT_STATUS } from '../types/LayoutTypes.js';
import { createLayoutConfig, validateLayoutConfig } from '../config/layoutConfig.js';

/**
 * 布局类型枚举
 * @deprecated 使用 LAYOUT_ALGORITHM_TYPES 替代
 */
export const LAYOUT_TYPES = Object.freeze({
  TREE: 'tree',
  FORCE: 'force',
  RADIAL: 'radial',
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
});

/**
 * 布局服务实现类
 * 用于管理不同类型的布局算法
 */
export class LayoutService extends ILayoutService {
  constructor(config = {}) {
    super();
    
    this.config = createLayoutConfig({ ...DEFAULT_CONFIG, ...config });
    this.algorithms = new Map();
    this.cache = new LayoutCache(this.config);
    this.currentAlgorithmType = this.config.algorithm || LAYOUT_ALGORITHM_TYPES.TREE;
    this.status = LAYOUT_STATUS.IDLE;
    this.listeners = new Set();
  }

  /**
   * 注册布局算法
   * @param {string} algorithmType - 算法类型
   * @param {ILayoutAlgorithm} algorithm - 算法实例
   */
  registerAlgorithm(algorithmType, algorithm) {
    this.algorithms.set(algorithmType, algorithm);
  }

  /**
   * 设置布局算法类型
   * @param {string} algorithmType - 算法类型
   */
  setAlgorithmType(algorithmType) {
    if (this.algorithms.has(algorithmType)) {
      this.currentAlgorithmType = algorithmType;
      this.cache.clear(); // 清除缓存，因为算法变了
      this.notifyListeners('algorithmChanged', algorithmType);
    } else {
      throw new Error(`布局算法类型 ${algorithmType} 不存在`);
    }
  }

  /**
   * 获取当前算法类型
   * @returns {string} - 当前算法类型
   */
  getCurrentAlgorithmType() {
    return this.currentAlgorithmType;
  }

  /**
   * 更新布局配置
   * @param {Object} config - 新的配置参数
   */
  updateConfig(config) {
    // 验证配置
    const validation = validateLayoutConfig(config);
    if (!validation.valid) {
      throw new Error(`配置验证失败: ${validation.errors.join(', ')}`);
    }

    this.config = createLayoutConfig({
      ...this.config,
      ...config
    });
    
    // 更新所有布局算法的配置
    for (const algorithm of this.algorithms.values()) {
      algorithm.updateConfig(this.config);
    }

    // 清除缓存，因为配置变了
    this.cache.clear();
    this.notifyListeners('configUpdated', this.config);
  }

  /**
   * 计算节点布局
   * @param {Array} nodes - 节点数组
   * @param {string} algorithmType - 可选，指定算法类型
   * @returns {Promise<Array>} - 更新后的节点数组
   */
  async calculateLayout(nodes, algorithmType = null) {
    const type = algorithmType || this.currentAlgorithmType;
    const algorithm = this.algorithms.get(type);
    
    if (!algorithm) {
      throw new Error(`布局算法类型 ${type} 不存在`);
    }

    // 验证节点数据
    if (!this.validateNodes(nodes)) {
      throw new Error('节点数据验证失败');
    }

    // 检查缓存
    const cacheKey = this.cache.generateKey(nodes, { 
      algorithm: type, 
      ...this.config 
    });
    const cachedResult = this.cache.get(cacheKey);
    
    if (cachedResult) {
      this.notifyListeners('layoutCacheHit', { nodes: cachedResult });
      return cachedResult;
    }

    try {
      this.status = LAYOUT_STATUS.CALCULATING;
      this.notifyListeners('layoutStarted', { algorithmType: type, nodeCount: nodes.length });

      // 执行布局计算
      const result = await algorithm.calculate(nodes);
      
      // 缓存结果
      this.cache.set(cacheKey, result);
      
      this.status = LAYOUT_STATUS.COMPLETED;
      this.notifyListeners('layoutCompleted', { result });
      
      return result;
    } catch (error) {
      this.status = LAYOUT_STATUS.ERROR;
      this.notifyListeners('layoutError', { error });
      throw error;
    }
  }

  /**
   * 验证节点数据
   * @param {Array} nodes - 节点数组
   * @returns {boolean} - 验证结果
   */
  validateNodes(nodes) {
    if (!Array.isArray(nodes)) {
      return false;
    }

    return nodes.every(node => {
      return node && 
             typeof node.id !== 'undefined' &&
             typeof node.x === 'number' &&
             typeof node.y === 'number' &&
             typeof node.width === 'number' &&
             typeof node.height === 'number';
    });
  }

  /**
   * 添加事件监听器
   * @param {Function} listener - 监听器函数
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * 移除事件监听器
   * @param {Function} listener - 监听器函数
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * 通知监听器
   * @param {string} event - 事件类型
   * @param {any} data - 事件数据
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('监听器执行错误:', error);
      }
    });
  }

  /**
   * 获取布局统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      currentAlgorithm: this.currentAlgorithmType,
      availableAlgorithms: Array.from(this.algorithms.keys()),
      status: this.status,
      cache: this.cache.getStats()
    };
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
    return Array.from(this.algorithms.keys());
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.cache.destroy();
    this.algorithms.clear();
    this.listeners.clear();
  }
}

// 创建默认布局服务实例并注册算法
export const defaultLayoutService = new LayoutService();

// 动态导入并注册树形布局算法
import('../algorithms/TreeLayoutAlgorithm.js').then(({ TreeLayoutAlgorithm }) => {
  defaultLayoutService.registerAlgorithm(
    LAYOUT_ALGORITHM_TYPES.TREE, 
    new TreeLayoutAlgorithm(defaultLayoutService.getConfig())
  );
}).catch(error => {
  console.error('Failed to load TreeLayoutAlgorithm:', error);
}); 