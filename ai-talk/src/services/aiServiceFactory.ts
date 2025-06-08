import { aiService } from './ai';
import { mockAIService } from './mockAI';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// API模式类型
export type ApiMode = 'real' | 'mock';

// AI服务接口
export interface AIServiceInterface {
  generateResponse(
    messages: ChatCompletionMessageParam[],
    onContent?: (content: string) => void,
    onReasoningContent?: (reasoning: string) => void
  ): Promise<string>;
  
  testConnection(): Promise<{ success: boolean; message?: string }>;
}

/**
 * AI服务工厂类
 * 根据模式返回相应的AI服务实例
 */
class AIServiceFactory {
  // 将默认模式改为模拟模式
  private mode: ApiMode = 'mock';
  
  /**
   * 设置API模式
   * @param mode API模式
   */
  setMode(mode: ApiMode): void {
    this.mode = mode;
    console.log(`API模式已切换为: ${mode}`);
    
    // 将当前模式保存到本地存储，以便在页面刷新后保持设置
    try {
      localStorage.setItem('api_mode', mode);
    } catch (error) {
      console.warn('无法保存API模式到本地存储', error);
    }
  }
  
  /**
   * 获取当前API模式
   */
  getMode(): ApiMode {
    // 尝试从本地存储获取保存的模式
    try {
      const savedMode = localStorage.getItem('api_mode') as ApiMode | null;
      if (savedMode && (savedMode === 'real' || savedMode === 'mock')) {
        this.mode = savedMode;
      }
    } catch (error) {
      console.warn('无法从本地存储获取API模式', error);
    }
    
    return this.mode;
  }
  
  /**
   * 获取AI服务实例
   * @returns 根据当前模式返回相应的AI服务实例
   */
  getService(): AIServiceInterface {
    return this.mode === 'real' ? aiService : mockAIService;
  }
}

// 导出单例实例
export const aiServiceFactory = new AIServiceFactory(); 