import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.ARK_API_KEY,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  });

  try {
    console.log('----- streaming request -----')
    const stream = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: '你是豆包，是由字节跳动开发的 AI 人工智能助手' },
        { role: 'user', content: '常见的十字花科植物有哪些？' },
      ],
      model: 'ep-20241226145851-qrc5d',
      stream: true,
    });

    console.log('回复内容：');
    for await (const part of stream) {
      process.stdout.write(part.choices[0]?.delta?.content || '');
    }
    process.stdout.write('\n');

  } catch (error: any) {
    if (error?.status === 429) {
      console.log('遇到请求限制，建议：');
      console.log('1. 等待几分钟后再试');
      console.log('2. 检查 API 的使用配额');
      console.log('3. 联系管理员提高限制');
    } else {
      console.error('Error:', {
        status: error?.status,
        message: error?.message,
        response: error?.response?.data
      });
    }
  }
}

main(); 