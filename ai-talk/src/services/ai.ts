import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class AIService {
  private getBaseURL(): string {
    const url = process.env.REACT_APP_API_URL || 'https://ai-mind-map-proxy.nionxd1928.workers.dev/proxy';
    console.log('Using API URL:', url);
    return url;
  }

  private async fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
    if (!options.headers) {
      options.headers = {};
    }
    
    const apiKey = localStorage.getItem('apiKey');
    if (apiKey) {
      (options.headers as Record<string, string>)['Authorization'] = `Bearer ${apiKey}`;
    }

    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 增加到 30 秒超时

        console.log(`Attempt ${i + 1} - Sending request to:`, url);
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log(`Attempt ${i + 1} - Response received:`, {
          status: response.status,
          statusText: response.statusText
        });
        return response;
      } catch (error) {
        console.log(`Attempt ${i + 1} failed:`, error);
        if (i === retries - 1) throw error;
        const delay = Math.pow(2, i) * 1000; // 指数退避延迟
        console.log(`Waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('所有重试都失败了');
  }

  private getHeaders(): HeadersInit {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) {
      throw new Error('请先在设置中配置 API Key');
    }

    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    } as HeadersInit;
  }

  async generateResponse(
    messages: ChatCompletionMessageParam[], 
    onContent?: (content: string) => void,
    onReasoningContent?: (reasoning: string) => void
  ) {
    try {
      const model = localStorage.getItem('model');
      if (!model) {
        throw new Error('请先在设置中配置模型名称');
      }

      const url = `${this.getBaseURL()}/chat/completions`;
      console.log('Sending request to:', url);

      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages,
          stream: Boolean(onContent),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // 根据状态码提供更具体的错误信息
        if (response.status === 401 || response.status === 403) {
          throw new Error('API密钥无效或已过期，请在设置中更新您的API密钥');
        }
        
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
      }

      if (onContent) {
        // 处理流式响应
        const reader = response.body?.getReader();
        if (!reader) throw new Error('无法读取响应内容');

        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          console.log('Received chunk:', chunk);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(5);
              if (data === '[DONE]') {
                console.log('Stream completed with [DONE] marker');
                break;
              }

              try {
                const parsed = JSON.parse(data);
                console.log('Parsed SSE data:', parsed);
                
                // 处理常规内容
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  onContent(content);
                }
                
                // 处理思考过程内容
                const reasoning = parsed.choices?.[0]?.delta?.reasoning_content || '';
                if (reasoning && onReasoningContent) {
                  onReasoningContent(reasoning);
                }
              } catch (e) {
                console.warn('解析 SSE 数据失败:', e, 'Raw data:', data);
              }
            }
          }
        }

        return fullResponse;
      } else {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch (error: any) {
      console.error('AI 服务错误:', {
        message: error.message,
        stack: error.stack,
        url: this.getBaseURL()
      });
      throw new Error(error?.message || '生成回答时出错');
    }
  }

  async testConnection(): Promise<{ success: boolean; message?: string }> {
    try {
      const model = localStorage.getItem('model');
      if (!model) {
        return { 
          success: false, 
          message: '请先在设置中配置模型名称' 
        };
      }

      const url = `${this.getBaseURL()}/models`;
      console.log('Testing connection to:', url);

      const response = await this.fetchWithRetry(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Connection test failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        // 根据状态码提供更具体的错误信息
        if (response.status === 401 || response.status === 403) {
          return { 
            success: false, 
            message: 'API密钥无效或已过期，请更新您的API密钥' 
          };
        }
        
        return { 
          success: false, 
          message: `API连接失败: ${response.status} ${response.statusText}` 
        };
      }

      return { success: true };
    } catch (error: any) {
      console.error('连接测试失败:', {
        message: error.message,
        stack: error.stack,
        url: this.getBaseURL()
      });
      
      return { 
        success: false, 
        message: error.message || '连接测试失败，请检查网络连接和API设置' 
      };
    }
  }
}

export const aiService = new AIService(); 