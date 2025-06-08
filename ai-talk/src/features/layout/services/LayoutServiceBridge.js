import { defaultLayoutService } from './LayoutService.js';
import { LAYOUT_ALGORITHM_TYPES } from '../types/LayoutTypes.js';
import { SimpleTreeLayout } from '../algorithms/SimpleTreeLayout.js';

/**
 * 布局服务桥接器
 * 为现有代码提供同步兼容接口
 */
class LayoutServiceBridge {
  constructor() {
    this.service = defaultLayoutService;
    this.lastSyncResult = [];
    this.isInitialized = false;
    
    // 创建后备布局算法
    this.fallbackLayout = new SimpleTreeLayout();
    
    // 等待算法注册完成
    this.initPromise = this.waitForInitialization();
  }

  /**
   * 等待服务初始化完成
   */
  async waitForInitialization() {
    // 等待TreeLayoutAlgorithm注册
    let attempts = 0;
    const maxAttempts = 50; // 最多等待5秒
    
    while (attempts < maxAttempts) {
      if (this.service.getAvailableLayoutTypes().includes(LAYOUT_ALGORITHM_TYPES.TREE)) {
        this.isInitialized = true;
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    console.error('布局服务初始化超时');
  }

  /**
   * 同步计算布局（兼容旧API）
   * @param {Array} nodes - 节点数组
   * @param {string} algorithmType - 算法类型
   * @returns {Array} - 布局后的节点数组
   */
  calculateLayout(nodes, algorithmType = LAYOUT_ALGORITHM_TYPES.TREE) {
    if (!nodes || nodes.length === 0) {
      return nodes || [];
    }

    // 如果服务还没初始化，使用后备布局算法
    if (!this.isInitialized) {
      console.warn('布局服务尚未初始化，使用简单布局算法');
      try {
        return this.fallbackLayout.calculateLayout(nodes);
      } catch (error) {
        console.error('后备布局算法失败:', error);
        return nodes;
      }
    }

    // 异步计算布局，但不等待结果
    this.service.calculateLayout(nodes, algorithmType)
      .then(result => {
        this.lastSyncResult = result;
        // 触发一个自定义事件来通知结果更新
        window.dispatchEvent(new CustomEvent('layoutUpdated', { 
          detail: { result, nodes } 
        }));
      })
      .catch(error => {
        console.error('布局计算失败:', error);
        // 如果计算失败，返回输入节点
        this.lastSyncResult = nodes;
      });

    // 立即返回上次的结果或当前节点
    return this.lastSyncResult.length > 0 ? this.lastSyncResult : nodes;
  }

  /**
   * 更新配置
   * @param {Object} config - 配置参数
   */
  updateConfig(config) {
    if (this.isInitialized) {
      this.service.updateConfig(config);
    }
  }

  /**
   * 获取当前配置
   * @returns {Object} - 当前配置
   */
  getConfig() {
    return this.service.getConfig();
  }

  /**
   * 设置算法类型
   * @param {string} algorithmType - 算法类型
   */
  setLayoutType(algorithmType) {
    if (this.isInitialized) {
      this.service.setAlgorithmType(algorithmType);
    }
  }

  /**
   * 获取当前算法类型
   * @returns {string} - 当前算法类型
   */
  getCurrentLayoutType() {
    return this.service.getCurrentAlgorithmType();
  }

  /**
   * 获取可用的布局类型
   * @returns {Array} - 可用布局类型数组
   */
  getAvailableLayoutTypes() {
    return this.service.getAvailableLayoutTypes();
  }
}

// 创建桥接服务实例
export const layoutServiceBridge = new LayoutServiceBridge();

// 为了向后兼容，导出默认实例
export { layoutServiceBridge as defaultLayoutService }; 