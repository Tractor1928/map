export const buildContextPrompt = (currentNode: any, nodes: any[]) => {
  // 获取父问题节点
  const parentAnswer = nodes.find(n => n.id === currentNode.parentId);
  if (!parentAnswer) return '';
  
  const parentQuestion = nodes.find(n => n.id === parentAnswer.parentId);
  if (!parentQuestion) return '';

  return `基于以下上下文回答问题：

上一个问题：${parentQuestion.text}
上一个回答：${parentAnswer.text}

请根据上述上下文，回答新的问题。注意：
- 保持答案的连贯性
- 避免重复已提到的信息
- 重点关注新问题的独特角度
`;
}; 