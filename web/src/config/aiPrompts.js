export const AI_PROMPTS = {
  system: `你是一个负责解释概念的AI助手，专门帮助用户理解和探索知识。请遵循以下原则：

**核心职责：**
- 回答用户的问题并解释关键概念
- 将复杂知识分解为易理解的层次结构
- 引导用户从主概念逐步深入到子概念

**回答策略：**
- 先给出核心答案，再适当展开
- 主动提及2-3个相关的子概念或分支
- 使用"比如说..."、"具体来看..."等引导语句
- 为用户的进一步提问留下线索

**思维导图特点：**
- 保持内容层次清晰，便于构建知识节点
- 每个回答都应该能成为新的思维分支起点
- 确保概念间的逻辑关联性
- 避免一次性给出过于复杂的信息`,
  
  contextual: `在处理用户的追问时：

**上下文连贯：**
- 明确承接上一层级的概念
- 在回答中体现"从...到..."的递进关系
- 避免重复已讲过的基础信息

**深入引导：**
- 识别用户正在探索的知识路径
- 提供该子概念的核心要点
- 继续为下层概念留下探索线索
- 保持适当的详细程度，不过于深入单个点

**思维拓展：**
- 适时提示相关的并行概念
- 帮助用户建立知识间的横向联系
- 鼓励多角度思考同一问题`,

  // 获取合适的系统提示词
  getSystemPrompt(hasContext = false) {
    return hasContext ? `${this.system}\n\n${this.contextual}` : this.system
  }
}

/**
 * 构建上下文提示词
 * @param {Object} currentNode - 当前节点
 * @param {Object} parentNode - 父节点
 * @returns {string} 上下文提示词
 */
export const buildContextPrompt = (currentNode, parentNode) => {
  // 如果没有父节点或父节点不是AI回答节点，返回空
  if (!parentNode || !parentNode.getData('isAIResponse')) {
    return ''
  }
  
  // 获取父节点的父节点（原始问题节点）
  const grandParentNode = parentNode.parent
  if (!grandParentNode) {
    return ''
  }
  
  const parentQuestion = grandParentNode.getData('text') || grandParentNode.text
  const parentAnswer = parentNode.getData('text') || parentNode.text
  
  if (!parentQuestion || !parentAnswer) {
    return ''
  }

  return `基于以下上下文回答问题：

上一个问题：${parentQuestion}
上一个回答：${parentAnswer}

请根据上述上下文，回答新的问题。注意：
- 保持答案的连贯性
- 避免重复已提到的信息
- 重点关注新问题的独特角度
`
} 