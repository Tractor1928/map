/**
 * 树形数据导航工具
 *
 * 移动端的核心逻辑。不依赖 simple-mind-map 实例，直接操作树形 JSON 数据。
 * 所有数据操作与 simple-mind-map 的数据格式兼容。
 *
 * 使用方式：
 *   import { createTreeNavigator } from './useTreeNavigator'
 *   const nav = createTreeNavigator()
 *   nav.loadTreeData()
 *   const node = nav.findNode('some-uid')
 *   nav.createChildNode(parentId, 'new node text')
 *   nav.saveTreeData()
 */

import { getData, storeData } from '@/api'
import { createUid } from 'simple-mind-map/src/utils'

/**
 * 创建一个树导航器实例
 * @returns {Object} treeNavigator
 */
export function createTreeNavigator() {
  // 内部状态：完整树数据
  let treeData = null

  return {
    // ==================== 数据加载/保存 ====================

    /**
     * 加载完整树数据
     * @returns {{ root: Object, layout: string, theme: Object, view: Object }}
     */
    loadTreeData() {
      treeData = getData()
      return treeData
    },

    /**
     * 获取原始树数据
     */
    getTreeData() {
      return treeData
    },

    /**
     * 保存完整树数据到 localStorage
     */
    saveTreeData() {
      if (treeData) {
        storeData({ root: treeData.root || treeData })
      }
    },

    /**
     * 直接设置树数据（用于同步）
     */
    setTreeData(data) {
      treeData = data
    },

    // ==================== 节点查找 ====================

    /**
     * 深度优先查找节点
     * @param {string} nodeId - 节点 UID
     * @returns {Object|null} 节点对象，包含 parent 引用
     */
    findNode(nodeId) {
      if (!treeData || !treeData.root || !nodeId) return null

      const rootNode = treeData.root
      if (this._getNodeUid(rootNode) === nodeId) return rootNode

      return this._dfsFind(rootNode, nodeId)
    },

    /**
     * 内部 DFS 查找
     */
    _dfsFind(node, targetId) {
      if (!node || !node.children) return null
      for (const child of node.children) {
        if (this._getNodeUid(child) === targetId) return child
        const found = this._dfsFind(child, targetId)
        if (found) return found
      }
      return null
    },

    /**
     * 获取节点 UID（兼容不同属性名）
     */
    _getNodeUid(node) {
      if (!node) return null
      return (node.data && node.data.uid) || node.uid || null
    },

    /**
     * 获取节点文本（用于分段和显示）
     *
     * 如果节点存储的是 HTML 富文本（来自桌面端），会将内联代码块
     * 转换回 markdown 围栏代码块格式，确保移动端 marked 能正确渲染。
     */
    _getNodeText(node) {
      if (!node) return ''
      const text = (node.data && node.data.text) || node.text || ''
      if (typeof text === 'string' && /<[^>]+>/.test(text)) {
        return this._htmlToDisplayText(text)
      }
      return String(text)
    },

    /**
     * 将 HTML 富文本转为适合移动端显示的文本
     *
     * 桌面端 formatRichTextForMindMap 会把 <pre><code> 替换为：
     *   <div style="border-radius;overflow:hidden">
     *     <div style="font-weight:bold">💻 LANG</div>
     *     <span style="font-family:monospace;white-space:pre-wrap">code</span>
     *   </div>
     * 这里将其还原为 markdown 围栏代码块，确保 marked 正常渲染。
     */
    _htmlToDisplayText(html) {
      const div = document.createElement('div')
      div.innerHTML = html

      // 检测桌面端代码块：<span> 同时具有 monospace 和 pre-wrap 样式
      const codeSpans = div.querySelectorAll('span')
      codeSpans.forEach(span => {
        const style = span.getAttribute('style') || ''
        if (/monospace/.test(style) && /pre-wrap/.test(style)) {
          // 向上查找包含 header 和 code 的容器
          const container = span.closest('div')
          if (!container) return
          // 提取语言标签（如 "💻 CPP" → "cpp"、"🟨 C++" → "cpp"）
          const header = container.querySelector(':scope > div')
          let lang = ''
          if (header) {
            const headerText = (header.textContent || '').trim()
            // 去掉 emoji 前缀，取第一个词作为语言标识
            const plain = headerText.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}]/gu, '').trim()
            lang = plain.split(/\s+/)[0].replace(/[+#]/g, 'p').toLowerCase()
          }
          // 构建 markdown 围栏代码块
          const codeText = span.textContent || ''
          const mdCodeBlock = '\n```' + lang + '\n' + codeText.trimEnd() + '\n```\n'
          // 用 markdown 代码块替换整个容器
          container.replaceWith(mdCodeBlock)
        }
      })

      return div.textContent || div.innerText || html
    },

    // ==================== 节点导航 ====================

    /**
     * 获取父节点
     * @param {string} nodeId
     * @returns {{ id: string, text: string, children: Array }} | null
     */
    getParent(nodeId) {
      if (!treeData || !treeData.root) return null
      return this._findParent(treeData.root, nodeId)
    },

    _findParent(node, targetId) {
      if (!node || !node.children) return null
      for (const child of node.children) {
        if (this._getNodeUid(child) === targetId) {
          return {
            id: this._getNodeUid(node),
            text: this._getNodeText(node),
            children: node.children
          }
        }
        const found = this._findParent(child, targetId)
        if (found) return found
      }
      return null
    },

    /**
     * 获取子节点列表
     * @param {string} nodeId
     * @returns {Array<{ id: string, text: string, hasChildren: boolean }>}
     */
    getChildren(nodeId) {
      const node = this.findNode(nodeId)
      if (!node || !node.children || node.children.length === 0) return []
      return node.children.map(child => ({
        id: this._getNodeUid(child),
        text: this._getNodeText(child),
        hasChildren: Boolean(child.children && child.children.length > 0)
      }))
    },

    /**
     * 获取第一个子节点
     */
    getFirstChild(nodeId) {
      const children = this.getChildren(nodeId)
      return children.length > 0 ? children[0] : null
    },

    /**
     * 检查是否有子节点
     */
    hasChildren(nodeId) {
      const node = this.findNode(nodeId)
      return Boolean(node && node.children && node.children.length > 0)
    },

    /**
     * 获取兄弟节点列表
     * @param {string} nodeId
     * @returns {Array<{ id: string, text: string, hasChildren: boolean }>}
     */
    getSiblings(nodeId) {
      const parent = this.getParent(nodeId)
      if (!parent) {
        // 根节点：无兄弟
        return [{
          id: this._getNodeUid(treeData.root),
          text: this._getNodeText(treeData.root),
          hasChildren: Boolean(treeData.root.children && treeData.root.children.length > 0)
        }]
      }
      const parentNode = this.findNode(parent.id)
      if (!parentNode || !parentNode.children) return []
      return parentNode.children.map(child => ({
        id: this._getNodeUid(child),
        text: this._getNodeText(child),
        hasChildren: Boolean(child.children && child.children.length > 0)
      }))
    },

    /**
     * 获取兄弟节点索引
     */
    getSiblingIndex(nodeId) {
      const siblings = this.getSiblings(nodeId)
      return siblings.findIndex(s => s.id === nodeId)
    },

    /**
     * 获取下一个兄弟节点
     */
    getNextSibling(nodeId) {
      const siblings = this.getSiblings(nodeId)
      const idx = this.getSiblingIndex(nodeId)
      if (idx >= 0 && idx < siblings.length - 1) {
        return siblings[idx + 1]
      }
      return null
    },

    /**
     * 获取上一个兄弟节点
     */
    getPrevSibling(nodeId) {
      const siblings = this.getSiblings(nodeId)
      const idx = this.getSiblingIndex(nodeId)
      if (idx > 0) {
        return siblings[idx - 1]
      }
      return null
    },

    // ==================== 路径计算 ====================

    /**
     * 获取从根节点到当前节点的完整路径
     * @param {string} nodeId
     * @returns {Array<{ id: string, text: string }>}
     */
    getNodePath(nodeId) {
      if (!treeData || !treeData.root) return []
      const rootId = this._getNodeUid(treeData.root)
      if (nodeId === rootId) {
        return [{ id: rootId, text: this._getNodeText(treeData.root) }]
      }
      const path = this._buildPath(treeData.root, nodeId, [])
      return path.length > 0 ? path : [{ id: nodeId, text: '未知节点' }]
    },

    _buildPath(node, targetId, currentPath) {
      if (!node) return null
      const nodeInfo = {
        id: this._getNodeUid(node),
        text: this._getNodeText(node)
      }
      const newPath = [...currentPath, nodeInfo]

      if (this._getNodeUid(node) === targetId) return newPath

      if (node.children) {
        for (const child of node.children) {
          const result = this._buildPath(child, targetId, newPath)
          if (result) return result
        }
      }
      return null
    },

    // ==================== 节点操作 ====================

    /**
     * 创建子节点
     * @param {string} parentId - 父节点 UID
     * @param {string} text - 节点文本
     * @param {Object} extraData - 额外数据 { isAIResponse, aiStatus, ... }
     * @returns {string|null} 新节点的 UID
     */
    createChildNode(parentId, text, extraData = {}) {
      const parentNode = this.findNode(parentId)
      if (!parentNode) {
        console.warn('[TreeNavigator] 找不到父节点:', parentId)
        return null
      }

      const newUid = createUid()
      const newNode = {
        data: {
          text: text,
          uid: newUid,
          expand: true,
          ...extraData
        },
        children: []
      }

      if (!parentNode.children) {
        parentNode.children = []
      }
      parentNode.children.push(newNode)

      // 自动保存
      this.saveTreeData()

      return newUid
    },

    /**
     * 更新节点文本
     * @param {string} nodeId
     * @param {string} text
     */
    updateNodeText(nodeId, text) {
      const node = this.findNode(nodeId)
      if (!node) {
        console.warn('[TreeNavigator] 找不到节点:', nodeId)
        return false
      }
      if (!node.data) node.data = {}
      node.data.text = text
      this.saveTreeData()
      return true
    },

    /**
     * 更新节点数据（合并到 data 对象）
     * @param {string} nodeId
     * @param {Object} data
     */
    updateNodeData(nodeId, data) {
      const node = this.findNode(nodeId)
      if (!node) {
        console.warn('[TreeNavigator] 找不到节点:', nodeId)
        return false
      }
      if (!node.data) node.data = {}
      Object.assign(node.data, data)
      this.saveTreeData()
      return true
    },

    /**
     * 获取节点完整数据对象
     */
    getNodeData(nodeId) {
      return this.findNode(nodeId)
    },

    /**
     * 生成合法 UID
     */
    generateUid() {
      return createUid()
    },

    // ==================== 根节点相关 ====================

    /**
     * 获取根节点 ID
     */
    getRootId() {
      if (!treeData || !treeData.root) return null
      return this._getNodeUid(treeData.root)
    },

    /**
     * 判断是否是根节点
     */
    isRoot(nodeId) {
      return nodeId === this.getRootId()
    }
  }
}

// 默认导出单例工厂
export default createTreeNavigator
