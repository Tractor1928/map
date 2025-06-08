/**
 * 布局服务接口
 * 定义布局服务的统一API
 */
export class ILayoutService {
  /**
   * 计算节点布局
   * @param {Array} nodes - 节点数组
   * @param {string} algorithmType - 布局算法类型
   * @returns {Promise<Array>} - 计算后的节点数组
   */
  calculateLayout(nodes, algorithmType) {
    throw new Error('calculateLayout method must be implemented');
  }

  /**
   * 更新布局配置
   * @param {Object} config - 配置参数
   */
  updateConfig(config) {
    throw new Error('updateConfig method must be implemented');
  }

  /**
   * 设置布局算法类型
   * @param {string} algorithmType - 算法类型
   */
  setAlgorithmType(algorithmType) {
    throw new Error('setAlgorithmType method must be implemented');
  }

  /**
   * 获取当前算法类型
   * @returns {string} - 当前算法类型
   */
  getCurrentAlgorithmType() {
    throw new Error('getCurrentAlgorithmType method must be implemented');
  }

  /**
   * 验证节点数据
   * @param {Array} nodes - 节点数组
   * @returns {boolean} - 验证结果
   */
  validateNodes(nodes) {
    throw new Error('validateNodes method must be implemented');
  }
} 