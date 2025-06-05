import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';

// 指定 .env 文件路径
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!(process.env.ARK_API_KEY && process.env.ARK_API_KEY !== 'your_api_key_here')
  });
});

// 添加环境变量检查
if (!process.env.ARK_API_KEY || process.env.ARK_API_KEY === 'your_api_key_here') {
  console.warn('⚠️  WARNING: ARK_API_KEY is not set or using placeholder value. AI features will not work.');
}

if (!process.env.API_BASE_URL) {
  console.warn('⚠️  WARNING: API_BASE_URL is not set. Using default OpenAI API URL.');
  process.env.API_BASE_URL = 'https://api.openai.com/v1';
}

const openai = new OpenAI({
  apiKey: process.env.ARK_API_KEY || 'placeholder-key',
  baseURL: process.env.API_BASE_URL,
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // 检查API密钥是否有效
    if (!process.env.ARK_API_KEY || process.env.ARK_API_KEY === 'your_api_key_here' || process.env.ARK_API_KEY === 'placeholder-key') {
      res.status(503).json({ 
        error: 'AI服务暂时不可用：需要配置有效的API密钥。请在.env文件中设置正确的ARK_API_KEY。' 
      });
      return;
    }
    
    const stream = await openai.chat.completions.create({
      messages,
      model: 'ep-20241226145851-qrc5d',
      stream: true,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const part of stream) {
      const content = part.choices[0]?.delta?.content || '';
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 