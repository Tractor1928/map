import IAIService from './IAIService.js'

/**
 * 现代化AI服务实现
 * 支持OpenAI GPT模型的流式响应和直接API调用
 */
export default class ModernAIService extends IAIService {
  constructor() {
    super()
    this.name = '现代AI服务'
    this.type = 'modern'
    this.features = ['流式响应', '多模型支持', '连接测试', '错误处理']
  }

  /**
   * 获取API基础URL
   * @returns {string} API基础URL
   */
  getBaseURL() {
    // 优先使用环境变量，否则使用代理URL
    return process.env.VUE_APP_API_URL || 'https://ai-mind-map-proxy.nionxd1928.workers.dev/proxy'
  }

  /**
   * 获取请求头
   * @returns {Object} 请求头对象
   */
  getHeaders() {
    const apiKey = localStorage.getItem('apiKey')
    if (!apiKey) {
      throw new Error('请先在设置中配置 API Key')
    }

    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * 获取配置的模型
   * @returns {string} 模型名称
   */
  getModel() {
    const model = localStorage.getItem('model')
    if (!model) {
      throw new Error('请先在设置中配置模型名称')
    }
    return model
  }

  /**
   * 带重试机制的fetch请求
   * @param {string} url - 请求URL
   * @param {Object} options - 请求选项
   * @param {number} retries - 重试次数
   * @returns {Promise<Response>} 响应对象
   */
  async fetchWithRetry(url, options, retries = 3) {
    if (!options.headers) {
      options.headers = {}
    }
    
    const apiKey = localStorage.getItem('apiKey')
    if (apiKey) {
      options.headers['Authorization'] = `Bearer ${apiKey}`
    }

    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时

        console.log(`🔄 尝试 ${i + 1} - 发送请求到:`, url)
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        console.log(`✅ 尝试 ${i + 1} - 收到响应:`, {
          status: response.status,
          statusText: response.statusText
        })
        return response
      } catch (error) {
        console.log(`❌ 尝试 ${i + 1} 失败:`, error)
        if (i === retries - 1) throw error
        const delay = Math.pow(2, i) * 1000 // 指数退避延迟
        console.log(`⏳ 等待 ${delay}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    throw new Error('所有重试都失败了')
  }

  /**
   * 生成AI回答
   * @param {Array} messages - 消息列表
   * @param {Function} onStreamContent - 流式内容回调
   * @returns {Promise<string>} AI回答内容
   */
  async generateResponse(messages, onStreamContent = null) {
    try {
      const model = this.getModel()
      const url = `${this.getBaseURL()}/chat/completions`
      
      console.log('🚀 发送AI请求到:', url)
      console.log('📝 使用模型:', model)
      console.log('💬 消息数量:', messages.length)

      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages,
          stream: Boolean(onStreamContent),
          temperature: 0.7,
          max_tokens: 2000
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API响应错误:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        
        // 根据状态码提供更具体的错误信息
        if (response.status === 401 || response.status === 403) {
          throw new Error('API密钥无效或已过期，请在设置中更新您的API密钥')
        }
        
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`)
      }

      if (onStreamContent) {
        return await this._handleStreamResponse(response, onStreamContent)
      } else {
        const data = await response.json()
        return data.choices?.[0]?.message?.content || ''
      }
    } catch (error) {
      console.error('💥 AI服务错误:', {
        message: error.message,
        stack: error.stack,
        url: this.getBaseURL()
      })
      throw new Error(error?.message || '生成回答时出错')
    }
  }

  /**
   * 处理流式响应
   * @param {Response} response - fetch响应对象
   * @param {Function} onStreamContent - 流式内容回调
   * @returns {Promise<string>} 完整回答内容
   */
  async _handleStreamResponse(response, onStreamContent) {
    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取响应内容')

    const decoder = new TextDecoder()
    let fullResponse = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content || ''
              if (content) {
                fullResponse += content
                onStreamContent(content)
              }
            } catch (e) {
              console.warn('解析流式数据失败:', e)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    return fullResponse || '回答生成完成，但内容为空'
  }

  /**
   * 测试AI服务连接
   * @returns {Promise<Object>} 连接测试结果
   */
  async testConnection() {
    try {
      const model = this.getModel()
      const url = `${this.getBaseURL()}/models`
      
      console.log('🔍 测试连接到:', url)
      console.log('🎯 使用模型:', model)

      const response = await this.fetchWithRetry(url, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ 连接测试失败:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        
        // 根据状态码提供更具体的错误信息
        if (response.status === 401 || response.status === 403) {
          return { 
            success: false, 
            message: 'API密钥无效或已过期，请更新您的API密钥' 
          }
        }
        
        return { 
          success: false, 
          message: `API连接失败: ${response.status} ${response.statusText}` 
        }
      }

      console.log('✅ 连接测试成功')
      return { success: true }
    } catch (error) {
      console.error('💥 连接测试失败:', {
        message: error.message,
        stack: error.stack,
        url: this.getBaseURL()
      })
      
      return { 
        success: false, 
        message: error.message || '连接测试失败，请检查网络连接和API设置' 
      }
    }
  }

  /**
   * 获取可用的AI模型列表
   * @returns {Promise<Array>} 模型列表
   */
  async getAvailableModels() {
    try {
      const url = `${this.getBaseURL()}/models`
      const response = await fetch(url, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        throw new Error('获取模型列表失败')
      }

      const data = await response.json()
      return data.data?.map(model => ({
        id: model.id,
        name: model.id,
        description: `模型: ${model.id}`
      })) || []
    } catch (error) {
      console.warn('获取AI模型列表失败:', error)
      // 返回默认模型列表
      return [
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '快速响应，适合日常对话' },
        { id: 'gpt-4', name: 'GPT-4', description: '更强大的推理能力，适合复杂任务' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '性能优化版本，平衡速度和质量' }
      ]
    }
  }

  /**
   * 获取服务配置信息
   * @returns {Object} 配置信息
   */
  getConfig() {
    const apiKey = localStorage.getItem('apiKey')
    const model = localStorage.getItem('model')
    
    return {
      name: this.name,
      type: this.type,
      baseURL: this.getBaseURL(),
      model: model || '未配置',
      hasApiKey: Boolean(apiKey),
      features: this.features
    }
  }
} 