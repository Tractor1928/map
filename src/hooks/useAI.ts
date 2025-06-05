import { useState, useCallback } from 'react';
import { aiServiceFactory, ApiMode } from '../services/aiServiceFactory';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reasoningContent, setReasoningContent] = useState<string>('');
  const [apiMode, setApiMode] = useState<ApiMode>(aiServiceFactory.getMode());

  // 切换API模式
  const switchApiMode = useCallback((mode: ApiMode) => {
    aiServiceFactory.setMode(mode);
    setApiMode(mode);
  }, []);

  // 生成响应
  const generateResponse = useCallback(async (
    messages: ChatCompletionMessageParam[],
    onProgress?: (content: string) => void,
    onReasoningProgress?: (reasoning: string) => void
  ) => {
    setIsLoading(true);
    setError(null);
    setReasoningContent('');

    try {
      // 获取当前模式下的服务
      const service = aiServiceFactory.getService();
      
      // 调用服务生成响应
      const response = await service.generateResponse(
        messages, 
        onProgress,
        onReasoningProgress
      );
      return response;
    } catch (err: any) {
      // 提供更具体的错误信息
      let errorMessage = err.message || '生成回答时出错';
      
      // 检查是否是API密钥相关的错误
      if (errorMessage.includes('API密钥') || 
          errorMessage.includes('401') || 
          errorMessage.includes('403') || 
          errorMessage.includes('Forbidden')) {
        errorMessage = 'API密钥无效或已过期，请在设置中更新您的API密钥';
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 测试API连接
  const testConnection = useCallback(async () => {
    try {
      const service = aiServiceFactory.getService();
      return await service.testConnection();
    } catch (error: any) {
      return { 
        success: false, 
        message: error?.message || '连接测试失败' 
      };
    }
  }, []);

  return {
    isLoading,
    error,
    reasoningContent,
    apiMode,
    switchApiMode,
    generateResponse,
    testConnection
  };
}; 