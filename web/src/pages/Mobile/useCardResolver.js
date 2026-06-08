/**
 * Card 解析器
 *
 * 在树导航器和移动端 UI 之间引入 Card 抽象层。
 * Card 是移动端浏览的基本单元——一个 Card 可以对应一个树节点，
 * 也可以跨越多个节点（Q&A 合并）。
 *
 * 核心规则：
 * 1. 回答节点 (isAIResponse) 对 UI 透明——被父问题节点 Card 吸收
 * 2. 有回答子节点的节点 → Q&A 合并 Card（标题=问题，内容=回答）
 * 3. 其他节点 → 独立节点 Card
 *
 * 使用方式：
 *   import { createCardResolver } from './useCardResolver'
 *   const cards = createCardResolver(treeNav)
 *   const card = cards.resolveCard(nodeId)
 */

import { splitContent } from '@/utils/segmentSplitter'

/**
 * 创建一个 Card 解析器实例
 * @param {Object} treeNav - 树导航器实例 (useTreeNavigator)
 * @returns {Object} cardResolver
 */
export function createCardResolver(treeNav) {
  // ==================== 内部辅助 ====================

  /**
   * 判断节点对象是否为 AI 回答节点
   */
  function isAnswerNode(node) {
    return Boolean(node && node.data && node.data.isAIResponse)
  }

  /**
   * 获取节点的第一个回答子节点对象
   */
  function getAnswerChild(node) {
    if (!node || !node.children || node.children.length === 0) return null
    return node.children.find(child => isAnswerNode(child)) || null
  }

  /**
   * 截断文本
   */
  function truncate(text, maxLen) {
    if (!text) return ''
    const plain = String(text).replace(/<[^>]+>/g, '')
    return plain.length > maxLen ? plain.substring(0, maxLen) + '...' : plain
  }

  // ==================== 公开 API ====================

  return {
    /**
     * 将节点 ID 解析为 Card 显示对象
     *
     * @param {string} nodeId
     * @returns {Object|null} Card 对象
     *   { nodeId, title, contentText, segments, isQA, answerNodeId }
     */
    resolveCard(nodeId) {
      const node = treeNav.findNode(nodeId)
      if (!node) return null

      // 规则 1: 回答节点 → 上溯到父问题节点
      if (isAnswerNode(node)) {
        const parent = treeNav.getParent(nodeId)
        if (parent) {
          return this.resolveCard(parent.id)
        }
        // 无父节点的回答节点（极端情况），当作独立节点
        return this._makeCard(nodeId, node, null, false)
      }

      // 规则 2: 有回答子节点 → QA 合并 Card
      const answerChild = getAnswerChild(node)
      if (answerChild) {
        return this._makeCard(nodeId, node, answerChild, true)
      }

      // 规则 3: 独立节点 Card
      return this._makeCard(nodeId, node, null, false)
    },

    /**
     * 构建 Card 对象（内部）
     */
    _makeCard(nodeId, node, answerChild, isQA) {
      const title = isQA
        ? treeNav._getNodeText(node)
        : ''
      const contentText = isQA
        ? treeNav._getNodeText(answerChild)
        : treeNav._getNodeText(node)

      const answerNodeId = answerChild
        ? treeNav._getNodeUid(answerChild)
        : null

      return {
        nodeId,
        title,
        contentText,
        segments: splitContent(contentText),
        isQA,
        answerNodeId
      }
    },

    // ==================== Card 导航 ====================

    /**
     * 获取 Card 级别的兄弟列表（用于底部预览）
     * @returns {{ prev, current, next } | null}
     */
    getCardSiblings(nodeId) {
      const card = this.resolveCard(nodeId)
      if (!card) return null

      const parent = treeNav.getParent(card.nodeId)
      if (!parent) {
        // 根节点：无兄弟
        const rootId = treeNav.getRootId()
        const rootNode = rootId ? treeNav.findNode(rootId) : null
        return {
          prev: null,
          current: { id: card.nodeId, text: truncate(card.title || (rootNode ? treeNav._getNodeText(rootNode) : ''), 30) },
          next: null
        }
      }

      const parentNode = treeNav.findNode(parent.id)
      if (!parentNode || !parentNode.children) {
        return { prev: null, current: { id: card.nodeId, text: truncate(card.title || '', 30) }, next: null }
      }

      // 过滤掉回答节点（已被父问题 Card 吸收）
      const visibleChildren = parentNode.children
        .filter(child => !isAnswerNode(child))
        .map(child => ({
          id: treeNav._getNodeUid(child),
          text: truncate(treeNav._getNodeText(child), 30)
        }))

      const idx = visibleChildren.findIndex(c => c.id === card.nodeId)

      return {
        prev: idx > 0 ? visibleChildren[idx - 1] : null,
        current: visibleChildren[idx] || { id: card.nodeId, text: truncate(card.title || '', 30) },
        next: idx >= 0 && idx < visibleChildren.length - 1 ? visibleChildren[idx + 1] : null
      }
    },

    /**
     * 获取下一个 Card 兄弟
     */
    getNextCard(nodeId) {
      const card = this.resolveCard(nodeId)
      if (!card) return null

      const parent = treeNav.getParent(card.nodeId)
      if (!parent) return null

      const parentNode = treeNav.findNode(parent.id)
      if (!parentNode || !parentNode.children) return null

      const visibleChildren = parentNode.children.filter(child => !isAnswerNode(child))
      const currentIdx = visibleChildren.findIndex(
        child => treeNav._getNodeUid(child) === card.nodeId
      )

      if (currentIdx >= 0 && currentIdx < visibleChildren.length - 1) {
        const nextChild = visibleChildren[currentIdx + 1]
        return { id: treeNav._getNodeUid(nextChild), text: treeNav._getNodeText(nextChild) }
      }
      return null
    },

    /**
     * 获取上一个 Card 兄弟
     */
    getPrevCard(nodeId) {
      const card = this.resolveCard(nodeId)
      if (!card) return null

      const parent = treeNav.getParent(card.nodeId)
      if (!parent) return null

      const parentNode = treeNav.findNode(parent.id)
      if (!parentNode || !parentNode.children) return null

      const visibleChildren = parentNode.children.filter(child => !isAnswerNode(child))
      const currentIdx = visibleChildren.findIndex(
        child => treeNav._getNodeUid(child) === card.nodeId
      )

      if (currentIdx > 0) {
        const prevChild = visibleChildren[currentIdx - 1]
        return { id: treeNav._getNodeUid(prevChild), text: treeNav._getNodeText(prevChild) }
      }
      return null
    },

    /**
     * 获取父 Card
     */
    getParentCard(nodeId) {
      const card = this.resolveCard(nodeId)
      if (!card) return null

      const parent = treeNav.getParent(card.nodeId)
      if (!parent) return null

      // 如果父节点是回答节点，继续上溯（极端情况防护）
      const parentNode = treeNav.findNode(parent.id)
      if (isAnswerNode(parentNode)) {
        return treeNav.getParent(parent.id) || null
      }

      return parent
    },

    /**
     * 获取第一个子 Card
     */
    getChildCard(nodeId) {
      const card = this.resolveCard(nodeId)
      if (!card) return null

      const node = treeNav.findNode(card.nodeId)
      if (!node || !node.children) return null

      // QA 卡：子节点入口在回答节点下
      if (card.isQA && card.answerNodeId) {
        const answerNode = treeNav.findNode(card.answerNodeId)
        if (answerNode && answerNode.children && answerNode.children.length > 0) {
          const firstNonAnswer = answerNode.children.find(child => !isAnswerNode(child))
          if (firstNonAnswer) {
            return {
              id: treeNav._getNodeUid(firstNonAnswer),
              text: treeNav._getNodeText(firstNonAnswer)
            }
          }
        }
        return null
      }

      // 普通卡：第一个非回答子节点
      const firstNonAnswer = node.children.find(child => !isAnswerNode(child))
      if (firstNonAnswer) {
        return {
          id: treeNav._getNodeUid(firstNonAnswer),
          text: treeNav._getNodeText(firstNonAnswer)
        }
      }
      return null
    },

    /**
     * 是否有子 Card
     */
    hasChildCard(nodeId) {
      const card = this.resolveCard(nodeId)
      if (!card) return false

      const node = treeNav.findNode(card.nodeId)
      if (!node || !node.children) return false

      // QA 卡：检查回答节点是否有非回答子节点
      if (card.isQA && card.answerNodeId) {
        const answerNode = treeNav.findNode(card.answerNodeId)
        if (answerNode && answerNode.children) {
          return answerNode.children.some(child => !isAnswerNode(child))
        }
        return false
      }

      // 普通卡：是否有非回答子节点
      return node.children.some(child => !isAnswerNode(child))
    },

    /**
     * 获取面包屑路径（QA 卡显示问题文本，过滤回答节点）
     */
    getBreadcrumb(nodeId) {
      const card = this.resolveCard(nodeId)
      if (!card) return []

      const path = treeNav.getNodePath(card.nodeId)
      return path.filter(item => {
        const node = treeNav.findNode(item.id)
        return !isAnswerNode(node)
      })
    }
  }
}

export default createCardResolver
