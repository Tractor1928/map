/**
 * AI思维导图代理服务器
 * 用于处理跨域请求和API代理
 */

// 允许的源域名列表
const ALLOWED_ORIGINS = [
  'https://YOUR_USERNAME.github.io',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// CORS头部设置
const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

/**
 * 处理CORS预检请求
 */
function handleCORS(request) {
  const origin = request.headers.get('Origin');
  const isAllowedOrigin = ALLOWED_ORIGINS.some(allowedOrigin => 
    origin && (origin === allowedOrigin || allowedOrigin === '*')
  );

  const corsHeaders = {
    ...CORS_HEADERS,
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : ALLOWED_ORIGINS[0],
  };

  return corsHeaders;
}

/**
 * 处理OPTIONS预检请求
 */
function handleOptions(request) {
  return new Response(null, {
    status: 200,
    headers: handleCORS(request)
  });
}

/**
 * 代理请求到目标API
 */
async function proxyRequest(request, targetUrl) {
  const corsHeaders = handleCORS(request);
  
  try {
    // 构建新的请求
    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });

    // 发送请求到目标API
    const response = await fetch(newRequest);
    
    // 创建新的响应并添加CORS头部
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        ...corsHeaders,
      },
    });

    return newResponse;
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: '代理请求失败', 
      message: error.message 
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * 主要的请求处理函数
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  
  // 处理OPTIONS预检请求
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  // 根路径返回服务信息
  if (url.pathname === '/') {
    return new Response(JSON.stringify({
      service: 'AI思维导图代理服务',
      version: '1.0.0',
      endpoints: {
        '/openai/*': 'OpenAI API代理',
        '/health': '健康检查'
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS(request),
      },
    });
  }

  // 健康检查端点
  if (url.pathname === '/health') {
    return new Response(JSON.stringify({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS(request),
      },
    });
  }

  // OpenAI API代理
  if (url.pathname.startsWith('/openai/')) {
    const targetPath = url.pathname.replace('/openai', '');
    const targetUrl = `https://api.openai.com${targetPath}${url.search}`;
    return proxyRequest(request, targetUrl);
  }

  // 其他API代理示例 (根据需要添加)
  if (url.pathname.startsWith('/api/')) {
    // 可以在这里添加其他API的代理逻辑
    return new Response(JSON.stringify({ 
      error: '未找到API端点' 
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...handleCORS(request),
      },
    });
  }

  // 404响应
  return new Response(JSON.stringify({ 
    error: '未找到资源' 
  }), {
    status: 404,
    headers: {
      'Content-Type': 'application/json',
      ...handleCORS(request),
    },
  });
}

// 导出fetch处理函数
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  },
}; 