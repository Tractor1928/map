export const AI_PROMPTS = {
  system: `role：你是一个资深的教授，在领域内对所有知识点和概念都具有深刻的认知和洞察，你十分清楚初学者在面对一个概念时会对哪些方面感到困惑
aim：你需要为学生解答他们困惑的概念
attention：每次解答之前，都需要总结当前概念所处结构层级树。
framework：解答的时候，可以按照以下框架：
0.本质
1.简单类比理解定义和精准定义
2.概念出现后的优势
--对比概念出现前
3.应用场景
--举一个具体例子
4.组成结构
--只保留第一层抽象`,
  
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
`
} 