/**
 * AI服务统一接口定义
 * 所有AI服务实现必须遵循此接口
 * 接口名称以大写字母I开头，符合命名规范
 */
export default class IAIService {
  /**
   * 生成AI回答
   * @param {Array} messages - 消息列表，格式: [{role: 'user', content: '问题内容'}]
   * @param {Function} onProgress - 进度回调函数，用于流式响应
   * @param {Function} onReasoningProgress - 思考过程回调函数（可选）
   * @returns {Promise<string>} AI回答内容
   */
  async generateResponse(messages, onProgress, onReasoningProgress) {
    throw new Error('generateResponse方法必须被实现')
  }

  /**
   * 测试AI服务连接
   * @returns {Promise<{success: boolean, message?: string}>} 连接测试结果
   */
  async testConnection() {
    throw new Error('testConnection方法必须被实现')
  }

  /**
   * 获取可用的AI模型列表
   * @returns {Promise<Array>} 模型列表
   */
  async getAvailableModels() {
    throw new Error('getAvailableModels方法必须被实现')
  }

  /**
   * 获取服务配置信息
   * @returns {Object} 服务配置
   */
  getServiceConfig() {
    throw new Error('getServiceConfig方法必须被实现')
  }
} 