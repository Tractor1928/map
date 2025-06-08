/**
 * 布局算法接口
 * 定义所有布局算法必须实现的方法
 */
export class ILayoutAlgorithm {
  /**
   * 构造函数
   * @param {Object} config - 算法配置
   */
  constructor(config) {
    this.config = config || {};
    this.name = this.constructor.name;
  }

  /**
   * 计算布局
   * @param {Array} nodes - 节点数组
   * @returns {Promise<Array>} - 计算后的节点数组
   */
  async calculate(nodes) {
    throw new Error('calculate method must be implemented');
  }

  /**
   * 更新配置
   * @param {Object} config - 新的配置参数
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };
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
    return nodes.every(node => this.validateNode(node));
  }

  /**
   * 验证单个节点
   * @param {Object} node - 节点对象
   * @returns {boolean} - 验证结果
   */
  validateNode(node) {
    return node && 
           typeof node.id !== 'undefined' && 
           typeof node.x === 'number' && 
           typeof node.y === 'number';
  }

  /**
   * 获取算法名称
   * @returns {string} - 算法名称
   */
  getName() {
    return this.name;
  }
} 