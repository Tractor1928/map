import ModernAIService from './ModernAIService.js'

/**
 * AI服务工厂类
 * 根据配置返回相应的AI服务实例，支持多种AI服务模式切换
 */
class AIServiceFactory {
  constructor() {
    this.mode = this.getMode()
    this.serviceInstances = new Map() // 服务实例缓存
  }

  /**
   * 设置AI服务模式
   * @param {string} mode - 服务模式 ('modern' | 'legacy')
   */
  setMode(mode) {
    const validModes = ['modern', 'legacy']
    if (!validModes.includes(mode)) {
      console.warn(`无效的AI服务模式: ${mode}，将使用默认模式`)
      mode = 'modern'
    }
    
    this.mode = mode
    try {
      localStorage.setItem('ai_service_mode', mode)
      console.log(`AI服务模式已切换到: ${mode}`)
    } catch (error) {
      console.warn('无法保存AI服务模式到本地存储', error)
    }
  }

  /**
   * 获取当前AI服务模式
   * @returns {string} 当前模式
   */
  getMode() {
    try {
      const savedMode = localStorage.getItem('ai_service_mode')
      if (savedMode && ['modern', 'legacy'].includes(savedMode)) {
        return savedMode
      }
    } catch (error) {
      console.warn('无法从本地存储获取AI服务模式', error)
    }
    return 'modern' // 默认使用现代模式
  }

  /**
   * 获取AI服务实例
   * @param {boolean} forceNew - 是否强制创建新实例
   * @returns {IAIService} AI服务实例
   */
  getService(forceNew = false) {
    // 如果需要强制新建或缓存中没有对应实例，则创建新实例
    if (forceNew || !this.serviceInstances.has(this.mode)) {
      const service = this.createService()
      this.serviceInstances.set(this.mode, service)
      return service
    }
    
    return this.serviceInstances.get(this.mode)
  }

  /**
   * 创建AI服务实例
   * @returns {IAIService} AI服务实例
   */
  createService() {
    switch(this.mode) {
      case 'modern':
        return new ModernAIService()
      case 'legacy':
        // 这里可以返回现有的AI服务实现
        // 暂时先返回现代服务作为兼容方案
        console.log('使用现代AI服务作为传统模式的兼容实现')
        return new ModernAIService()
      default:
        console.warn(`未知的AI服务模式: ${this.mode}，回退到现代模式`)
        return new ModernAIService()
    }
  }

  /**
   * 清除服务实例缓存
   */
  clearCache() {
    this.serviceInstances.clear()
    console.log('AI服务实例缓存已清除')
  }

  /**
   * 获取所有可用的服务模式
   * @returns {Array} 服务模式列表
   */
  getAvailableModes() {
    return [
      {
        key: 'modern',
        name: '现代AI服务',
        description: '直接调用AI API，支持流式响应，无需本地客户端',
        features: ['流式响应', '多模型支持', '连接测试', '错误处理']
      },
      {
        key: 'legacy',
        name: '传统AI服务',
        description: '通过本地客户端代理调用AI服务，兼容现有功能',
        features: ['本地客户端', '代理转发', '兼容性好']
      }
    ]
  }

  /**
   * 测试当前服务连接
   * @returns {Promise<{success: boolean, message?: string}>} 测试结果
   */
  async testCurrentService() {
    try {
      const service = this.getService()
      return await service.testConnection()
    } catch (error) {
      return {
        success: false,
        message: `服务测试失败: ${error.message}`
      }
    }
  }

  /**
   * 获取当前服务配置信息
   * @returns {Object} 服务配置
   */
  getCurrentServiceConfig() {
    try {
      const service = this.getService()
      return {
        mode: this.mode,
        ...service.getServiceConfig()
      }
    } catch (error) {
      console.error('获取服务配置失败:', error)
      return {
        mode: this.mode,
        name: '未知服务',
        error: error.message
      }
    }
  }
}

// 导出单例实例
export const aiServiceFactory = new AIServiceFactory()

// 为了调试方便，将工厂实例挂载到window对象
if (typeof window !== 'undefined') {
  window.aiServiceFactory = aiServiceFactory
}

export default aiServiceFactory 