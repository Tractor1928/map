import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// 模拟响应数据库
const MOCK_RESPONSES: Record<string, string> = {
  // 常见问题的模拟回答
  '什么是思维导图': '思维导图是一种图形化的思考工具，它通过分支和节点的方式，将中心主题与相关概念连接起来，帮助人们组织思想、记忆信息和解决问题。思维导图的特点包括：\n\n1. 以中心主题为核心\n2. 使用分支展开相关概念\n3. 通常使用关键词、图像和颜色\n4. 强调概念之间的联系\n5. 促进发散思维和创造力',
  
  '如何使用这个应用': '使用本思维导图应用的步骤：\n\n1. 创建节点：按Tab键创建新的问题节点\n2. 编辑内容：双击节点编辑文本\n3. 操作画布：鼠标拖拽移动，滚轮缩放\n4. AI问答：编辑问题节点后，系统会自动生成AI回答\n5. 删除节点：选中问题节点后按Delete键删除',
  
  '思维导图有什么好处': '思维导图的主要好处包括：\n\n1. 提高学习效率：将复杂信息可视化，便于理解和记忆\n2. 促进创造性思维：鼓励发散思考和建立新联系\n3. 增强记忆力：通过视觉和空间关系强化记忆\n4. 提升组织能力：帮助整理思路和规划项目\n5. 改善沟通效果：清晰展示想法和概念间的关系\n6. 节省时间：快速捕捉和组织信息',
  
  '如何制作好的思维导图': '制作高效思维导图的技巧：\n\n1. 使用中心主题：从核心概念开始，放在中央\n2. 保持简洁：每个节点使用关键词，避免长句\n3. 使用层次结构：主要分支连接主题，次要分支展开细节\n4. 添加视觉元素：使用颜色、图标增强视觉效果\n5. 保持空间：不要让图表过于拥挤\n6. 使用连接线：展示不同分支间的关系\n7. 定期修改：思维导图是动态工具，随思考深入而扩展',
  
  // 默认回复
  'default': '这是一个模拟的AI回答。在测试模式下，系统会返回预设的回答，而不消耗真实的API配额。如果您有特定问题，可以在设置中切换到真实API模式。'
};

// 思考过程模拟数据
const MOCK_REASONING: Record<string, string> = {
  '什么是思维导图': '分析问题：用户询问思维导图的定义和特点。\n我需要提供思维导图的基本概念，以及它的主要特点和用途。\n思维导图是一种视觉化思考工具，由Tony Buzan发明...',
  'default': '这是模拟的思考过程。在实际使用中，AI会展示其分析问题和形成答案的思考过程。'
};

/**
 * 模拟延迟函数
 * @param ms 延迟毫秒数
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 模拟流式响应
 * @param text 要流式返回的文本
 * @param onContent 内容回调函数
 * @param chunkSize 每次返回的字符数
 * @param delayMs 每次返回的延迟毫秒数
 */
async function simulateStreamResponse(
  text: string, 
  onContent?: (content: string) => void,
  onReasoningContent?: (reasoning: string) => void,
  chunkSize: number = 3,
  delayMs: number = 50
) {
  if (!onContent) return text;
  
  // 如果有思考过程回调，先发送思考过程
  if (onReasoningContent) {
    const reasoning = MOCK_REASONING['default'];
    for (let i = 0; i < reasoning.length; i += chunkSize) {
      const chunk = reasoning.substring(i, i + chunkSize);
      onReasoningContent(chunk);
      await delay(delayMs);
    }
  }
  
  // 发送主要内容
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.substring(i, i + chunkSize);
    onContent(chunk);
    await delay(delayMs);
  }
  
  return text;
}

/**
 * 查找最匹配的预设回答
 * @param query 用户查询
 * @returns 匹配的回答
 */
function findBestMatch(query: string): string {
  // 简化版的匹配逻辑，实际可以使用更复杂的算法
  const normalizedQuery = query.toLowerCase().trim();
  
  for (const key of Object.keys(MOCK_RESPONSES)) {
    if (normalizedQuery.includes(key.toLowerCase())) {
      return MOCK_RESPONSES[key];
    }
  }
  
  return MOCK_RESPONSES['default'];
}

export class MockAIService {
  async generateResponse(
    messages: ChatCompletionMessageParam[], 
    onContent?: (content: string) => void,
    onReasoningContent?: (reasoning: string) => void
  ) {
    try {
      console.log('使用模拟AI服务，不消耗API配额');
      
      // 提取用户消息
      const userMessage = messages.find(msg => msg.role === 'user')?.content as string || '';
      
      // 查找匹配的预设回答
      const response = findBestMatch(userMessage);
      
      // 模拟网络延迟
      await delay(500);
      
      // 如果提供了回调函数，模拟流式响应
      if (onContent) {
        return await simulateStreamResponse(response, onContent, onReasoningContent);
      }
      
      return response;
    } catch (error: any) {
      console.error('模拟AI服务错误:', error);
      throw new Error(error?.message || '生成回答时出错');
    }
  }

  async testConnection(): Promise<{ success: boolean; message?: string }> {
    // 模拟API总是返回成功
    return { success: true };
  }
}

export const mockAIService = new MockAIService(); 