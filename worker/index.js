// Cloudflare Worker 代码
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // 设置 CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  
  // 处理 OPTIONS 请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    })
  }
  
  try {
    // 获取请求路径
    const url = new URL(request.url)
    const path = url.pathname.replace('/proxy', '')
    
    // 处理根路径请求
    if (path === '' || path === '/') {
      return new Response(JSON.stringify({
        status: 'ok',
        message: '沙锅导图 API 代理服务正常运行中',
        usage: '请在应用中配置您的 API Key 后使用此服务',
        documentation: '访问 /proxy/models 路径需要提供有效的 Authorization 头'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }
    
    // 特殊处理 /models 路径
    if (path === '/models') {
      // 检查授权头
      const authHeader = request.headers.get('Authorization')
      if (!authHeader) {
        return new Response(JSON.stringify({
          error: 'Missing Authorization header'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        })
      }
      
      // 返回一个简单的模型列表响应
      return new Response(JSON.stringify({
        data: [
          { id: 'ep-20241226145851-qrc5d', name: 'Default Model' }
        ]
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }
    
    // 对于其他 API 路径，检查是否有 Authorization 头
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: {
          code: 'AuthenticationError',
          message: '请在应用中配置您的 API Key',
          type: 'AuthenticationError'
        }
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      })
    }
    
    // 构建转发到 API 的请求
    const apiUrl = `https://ark.cn-beijing.volces.com/api/v3${path}`
    
    // 复制原始请求的头信息
    const headers = new Headers(request.headers)
    
    // 创建新的请求
    const apiRequest = new Request(apiUrl, {
      method: request.method,
      headers: headers,
      body: request.body,
      redirect: 'follow'
    })
    
    // 发送请求到 API
    const response = await fetch(apiRequest)
    
    // 处理流式响应
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders
        }
      })
    }
    
    // 读取响应内容
    let responseBody
    const contentType = response.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      // 安全地解析 JSON
      try {
        const text = await response.text()
        // 尝试解析 JSON
        try {
          const json = JSON.parse(text)
          responseBody = JSON.stringify(json)
        } catch (e) {
          // JSON 解析失败，直接返回文本
          responseBody = text
        }
      } catch (e) {
        responseBody = JSON.stringify({
          error: 'Failed to read response body',
          message: e.message
        })
      }
    } else {
      // 非 JSON 内容直接使用文本
      responseBody = await response.text()
    }
    
    // 创建新的响应
    const newResponse = new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
    
    return newResponse
  } catch (error) {
    // 返回错误信息
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack,
      url: request.url
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    })
  }
} 