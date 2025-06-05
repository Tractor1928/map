import { v4 as uuidv4 } from 'uuid'; // 需要先安装: npm install uuid @types/uuid

interface ChatNode {
  id: string;
  text: string;
  type: 'question' | 'answer';
  parentId?: string;
  level: number;
  childrenIds: string[];
}

export const transformChatToNodes = (
  question: string, 
  answer: string,
  parentId?: string
): ChatNode[] => {
  const questionNode: ChatNode = {
    id: uuidv4(),
    text: question,
    type: 'question',
    parentId,
    level: parentId ? 1 : 0,
    childrenIds: []
  };

  const answerNode: ChatNode = {
    id: uuidv4(),
    text: answer,
    type: 'answer',
    parentId: questionNode.id,
    level: questionNode.level + 1,
    childrenIds: []
  };

  // 更新问题节点的子节点
  questionNode.childrenIds = [answerNode.id];

  return [questionNode, answerNode];
}; 