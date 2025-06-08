// AI服务模块统一导出
export { default as IAIService } from './IAIService.js'
export { default as ModernAIService } from './ModernAIService.js'
export { aiServiceFactory, default as AIServiceFactory } from './aiServiceFactory.js'

// 便捷导出
export const getAIService = () => {
  return aiServiceFactory.getService()
}

export const testAIConnection = async () => {
  return await aiServiceFactory.testCurrentService()
}

export const switchAIServiceMode = (mode) => {
  aiServiceFactory.setMode(mode)
}

// 版本信息
export const AI_SERVICE_VERSION = '1.0.0'

console.log(`AI服务模块已加载，版本: ${AI_SERVICE_VERSION}`) 