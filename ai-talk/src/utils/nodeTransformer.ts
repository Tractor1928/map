import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

/**
 * 将聊天消息和AI回复转换为节点结构
 * @param messages 聊天消息数组
 * @param aiResponse AI回复内容
 * @returns 转换后的节点数组
 */
export function transformChatToNodes(
  messages: ChatCompletionMessageParam[], 
  aiResponse: string
): any[] {
  // 提取用户问题
  const userMessage = messages.find(msg => msg.role === 'user')?.content as string || '';
  
  // 创建问题节点
  const questionNode = {
    id: 'question-' + Date.now(),
    type: 'question',
    text: userMessage,
    children: [] as string[]
  };
  
  // 创建回答节点
  const answerNode = {
    id: 'answer-' + Date.now(),
    type: 'answer',
    text: aiResponse,
    parentId: questionNode.id
  };
  
  // 将回答节点添加为问题节点的子节点
  questionNode.children.push(answerNode.id);
  
  // 返回节点数组
  return [questionNode, answerNode];
} 