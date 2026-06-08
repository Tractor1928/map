<template>
  <div class="mobile-page">
    <!-- 顶部导航栏 -->
    <MobileNavBar
      :breadcrumb="breadcrumb"
      @navigate-to="navigateToNode"
      @show-outline="showOutline = true"
      @show-search="showSearch = true"
    />

    <!-- 卡片区域 -->
    <div class="card-area" ref="cardArea">
      <!-- 节点标题（在 transition 外，切段时不显隐） -->
      <div class="card-node-name" v-if="currentNodeTitle" :class="{ 'qa-title': !!qaTitle }">
        <span v-if="qaTitle" class="qa-icon">💬</span>
        {{ currentNodeTitle }}
      </div>

      <transition :name="transitionName" mode="out-in">
        <NodeCard
          :key="`${currentNodeId}-${currentSegment}`"
          :node-data="currentNode"
          :segments="segments"
          :current-segment="currentSegment"
          :has-next-segment="currentSegment < segments.length - 1"
          :has-prev-segment="currentSegment > 0"
          :has-children="hasChildren"
          :has-parent="hasParent"
          @next-segment="handleNextSegment"
          @prev-segment="handlePrevSegment"
          @next-sibling="handleNextSibling"
          @prev-sibling="handlePrevSibling"
          @enter-child="handleEnterChild"
          @back-parent="handleBackParent"
          @text-selected="onTextSelected"
        />
      </transition>

      <!-- 右侧导航区：兄弟节点 + 段指示圆点 -->
      <div class="side-nav">
        <!-- 上一个同层节点 -->
        <div
          class="sibling-arrow up"
          :class="{ disabled: !hasPrevSibling }"
          @click.stop="hasPrevSibling && handlePrevSibling()"
          v-if="hasPrevSibling || hasNextSibling"
        >
          ▲
        </div>

        <!-- 段指示圆点 -->
        <div class="segment-dots" v-if="segments.length > 1">
          <span
            v-for="(s, i) in segments"
            :key="i"
            class="dot"
            :class="{ active: i === currentSegment }"
            @click.stop="handleJumpSegment(i)"
          />
        </div>

        <!-- 下一个同层节点 -->
        <div
          class="sibling-arrow down"
          :class="{ disabled: !hasNextSibling }"
          @click.stop="hasNextSibling && handleNextSibling()"
          v-if="hasPrevSibling || hasNextSibling"
        >
          ▼
        </div>
      </div>
    </div>

    <!-- 底部聊天栏 -->
    <BottomChatBar
      :current-node-id="currentNodeId"
      :answer-node-id="answerNodeId"
      :node-text="currentNodeTitle"
      :tree-nav="treeNav"
      @node-created="onNodeCreated"
      @answer-updating="onAnswerUpdating"
      @answer-complete="onAnswerComplete"
      @reasoning-update="onReasoningUpdate"
      @error="onAIError"
    />

    <!-- 思考过程抽屉 -->
    <ThinkingDrawer ref="thinkingDrawer" />

    <!-- 文字选中悬浮提问工具栏 -->
    <SelectionToolbar
      :visible="showSelectionToolbar"
      :selected-text="selectedText"
      :selection-rect="selectionRect"
      @ask="onAskSelectionWithSuffix('?')"
      @ask-howto="onAskSelectionWithSuffix('是怎么实现的？')"
      ref="selectionToolbar"
    />
  </div>
</template>

<script>
import MobileNavBar from './MobileNavBar.vue'
import NodeCard from './NodeCard.vue'
import BottomChatBar from './BottomChatBar.vue'
import ThinkingDrawer from './ThinkingDrawer.vue'
import SelectionToolbar from './SelectionToolbar.vue'
import { createTreeNavigator } from './useTreeNavigator'
import { createCardResolver } from './useCardResolver'
import { splitContent } from '@/utils/segmentSplitter'
import { aiServiceFactory } from '@/services/ai'
import { getCurrentPromptConfig } from '@/config/aiPrompts'

export default {
  name: 'MobileIndex',
  components: {
    MobileNavBar,
    NodeCard,
    BottomChatBar,
    ThinkingDrawer,
    SelectionToolbar
  },
  data() {
    return {
      // 树导航器
      treeNav: null,

      // Card 解析器
      cardResolver: null,

      // 当前状态
      currentNodeId: '',
      currentSegment: 0,
      segments: [],

      // QA 合并模式下的标题（问题文本）
      qaTitle: '',

      // 当前 QA 卡的回答节点 ID（用于流式更新追踪）
      answerNodeId: null,

      // 完整树数据
      treeData: null,

      // 面包屑路径
      breadcrumb: [],

      // 过渡动画名称
      transitionName: 'slide-up',

      // 父节点段位置记忆
      parentSegmentMap: {},

      // UI 状态
      showOutline: false,
      showSearch: false,
      loading: true,

      // 文字选中悬浮工具栏
      showSelectionToolbar: false,
      selectedText: '',
      selectionRect: null
    }
  },
  computed: {
    currentNode() {
      if (!this.treeNav || !this.currentNodeId) return null
      return this.treeNav.getNodeData(this.currentNodeId)
    },
    currentNodeTitle() {
      // QA 合并模式：使用问题文本作为标题
      if (this.qaTitle) return this.qaTitle
      const node = this.currentNode
      if (!node) return ''
      const text = this.treeNav._getNodeText(node)
      return text.length > 50 ? text.substring(0, 50) + '...' : text
    },
    hasChildren() {
      if (!this.cardResolver || !this.currentNodeId) return false
      return this.cardResolver.hasChildCard(this.currentNodeId)
    },
    hasParent() {
      if (!this.treeNav || !this.currentNodeId) return false
      return !this.treeNav.isRoot(this.currentNodeId)
    },
    hasPrevSibling() {
      if (!this.cardResolver || !this.currentNodeId) return false
      return !!this.cardResolver.getPrevCard(this.currentNodeId)
    },
    hasNextSibling() {
      if (!this.cardResolver || !this.currentNodeId) return false
      return !!this.cardResolver.getNextCard(this.currentNodeId)
    }
  },
  created() {
    this.init()
  },
  mounted() {
    // 监听页面可见性，回来时刷新数据
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    // 键盘方向键导航（桌面端使用移动模式时）
    document.addEventListener('keydown', this.handleKeydown)
    // 点击其他地方隐藏选中工具栏
    document.addEventListener('click', this.onDocumentClick, true)
  },
  beforeDestroy() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    document.removeEventListener('keydown', this.handleKeydown)
    document.removeEventListener('click', this.onDocumentClick, true)
  },
  methods: {
    /**
     * 初始化
     */
    init() {
      this.treeNav = createTreeNavigator()
      this.cardResolver = createCardResolver(this.treeNav)
      this.treeData = this.treeNav.loadTreeData()

      const rootId = this.treeNav.getRootId()
      if (rootId) {
        this.navigateToNode(rootId, 0, '')
      } else {
        this.loading = false
      }
    },

    /**
     * 导航到指定节点的指定段
     * @param {string} nodeId
     * @param {number} segmentIndex
     * @param {string} anim - 动画方向
     */
    navigateToNode(nodeId, segmentIndex = 0, anim = '') {
      if (!nodeId) return

      // 使用 Card 解析器获取卡片数据
      const card = this.cardResolver.resolveCard(nodeId)
      if (!card) return

      // 保存当前节点的段位置
      if (this.currentNodeId && this.currentNodeId !== card.nodeId) {
        this.parentSegmentMap[this.currentNodeId] = this.currentSegment
      }

      this.currentNodeId = card.nodeId
      this.currentSegment = segmentIndex
      this.segments = card.segments
      this.qaTitle = card.title
      this.answerNodeId = card.answerNodeId

      // 确保段索引合法
      if (this.currentSegment >= this.segments.length) {
        this.currentSegment = this.segments.length - 1
      }
      if (this.currentSegment < 0) {
        this.currentSegment = 0
      }

      // 计算面包屑
      this.breadcrumb = this.cardResolver.getBreadcrumb(card.nodeId)

      // 设置动画
      this.transitionName = anim || 'slide-up'

      // 滚动卡片区域到顶部
      this.$nextTick(() => {
        const cardBody = this.$el && this.$el.querySelector('.card-body')
        if (cardBody) {
          cardBody.scrollTop = 0
        }
      })

      this.loading = false
    },

    // ==================== 导航处理 ====================

    handleNextSegment() {
      if (this.currentSegment < this.segments.length - 1) {
        this.transitionName = 'slide-up'
        this.currentSegment++
      } else {
        // 最后一段 → 下一个兄弟节点
        this.handleNextSibling()
      }
    },

    handlePrevSegment() {
      if (this.currentSegment > 0) {
        this.transitionName = 'slide-down'
        this.currentSegment--
      } else {
        // 第一段 → 上一个兄弟节点
        this.handlePrevSibling()
      }
    },

    handleJumpSegment(index) {
      if (index >= 0 && index < this.segments.length && index !== this.currentSegment) {
        this.transitionName = index > this.currentSegment ? 'slide-up' : 'slide-down'
        this.currentSegment = index
      }
    },

    handleNextSibling() {
      const next = this.cardResolver.getNextCard(this.currentNodeId)
      if (next) {
        this.navigateToNode(next.id, 0, 'slide-up')
      } else {
        this.vibrate()
      }
    },

    handlePrevSibling() {
      const prev = this.cardResolver.getPrevCard(this.currentNodeId)
      if (prev) {
        // 定位到上一个兄弟的最后一段
        const prevCard = this.cardResolver.resolveCard(prev.id)
        const prevSegments = prevCard ? prevCard.segments : []
        this.navigateToNode(prev.id, Math.max(0, prevSegments.length - 1), 'slide-down')
      } else {
        this.vibrate()
      }
    },

    handleEnterChild() {
      const firstChild = this.cardResolver.getChildCard(this.currentNodeId)
      if (firstChild) {
        // 保存当前段位置以便返回时恢复
        this.parentSegmentMap[this.currentNodeId] = this.currentSegment
        this.navigateToNode(firstChild.id, 0, 'slide-left')
      } else {
        this.vibrate()
      }
    },

    handleBackParent() {
      const parent = this.cardResolver.getParentCard(this.currentNodeId)
      if (parent) {
        const savedSegment = this.parentSegmentMap[parent.id] || 0
        this.navigateToNode(parent.id, savedSegment, 'slide-right')
      } else {
        this.vibrate()
      }
    },

    // ==================== 键盘导航（桌面端使用移动模式时） ====================

    /**
     * 方向键映射（与自然滚动直觉一致）：
     *   ↓ / ArrowDown  → 下一段 / 下一个兄弟节点（前进）
     *   ↑ / ArrowUp    → 上一段 / 上一个兄弟节点（后退）
     *   → / ArrowRight → 进入子节点
     *   ← / ArrowLeft  → 返回父节点
     */
    handleKeydown(e) {
      // 如果焦点在输入框内，不拦截
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) {
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          this.handleNextSegment()
          break
        case 'ArrowUp':
          e.preventDefault()
          this.handlePrevSegment()
          break
        case 'ArrowRight':
          e.preventDefault()
          this.handleEnterChild()
          break
        case 'ArrowLeft':
          e.preventDefault()
          this.handleBackParent()
          break
      }
    },

    // ==================== AI 事件处理 ====================

    onNodeCreated(/* nodeId */) {
      // 新节点已创建
    },

    onAnswerUpdating({ nodeId, text }) {
      // 检查是否当前 QA 卡的回答节点在实时更新
      if (nodeId === this.answerNodeId) {
        this.segments = splitContent(text)
        // 保持当前段索引合法
        if (this.currentSegment >= this.segments.length) {
          this.currentSegment = Math.max(0, this.segments.length - 1)
        }
      }
    },

    onAnswerComplete({ nodeId, text }) {
      // QA 卡回答完成，刷新分段和预览
      if (nodeId === this.answerNodeId) {
        this.segments = splitContent(text)
        this.currentSegment = 0
      }
      this.$nextTick(() => {
        // 回答完成
      })
    },

    onReasoningUpdate(reasoning) {
      if (this.$refs.thinkingDrawer) {
        this.$refs.thinkingDrawer.show(reasoning)
      }
    },

    onAIError(message) {
      console.error('[Mobile] AI 错误:', message)
    },

    // ==================== 文字选中悬浮工具栏 ====================

    onTextSelected({ text, rect }) {
      if (text && rect) {
        this.selectedText = text
        this.selectionRect = rect
        this.showSelectionToolbar = true
        // 移动端选中后会立即触发 click，标记防误关
        this._toolbarJustShown = true
        setTimeout(() => { this._toolbarJustShown = false }, 500)
      } else {
        // 延迟隐藏，防止 click 事件在 toolbar 事件之前触发
        setTimeout(() => {
          if (this.showSelectionToolbar) {
            this.hideSelectionToolbar()
          }
        }, 200)
      }
    },

    hideSelectionToolbar() {
      this.showSelectionToolbar = false
      this.selectedText = ''
      this.selectionRect = null
    },

    onDocumentClick(e) {
      // 工具栏刚出现时，忽略紧接着的 click（移动端选中后的 tap）
      if (this._toolbarJustShown) return
      // 如果点击的不是工具栏内的元素，隐藏工具栏
      if (this.showSelectionToolbar) {
        const toolbar = this.$refs.selectionToolbar
        if (toolbar && toolbar.$el && !toolbar.$el.contains(e.target)) {
          this.hideSelectionToolbar()
        }
      }
    },

    async onAskSelectionWithSuffix(suffix) {
      const selectedText = this.selectedText
      this.hideSelectionToolbar()
      if (!this.treeNav || !this.currentNodeId || !selectedText) return

      // 对齐桌面端：拼接后缀（? 或 是怎么实现的？）
      const questionText = selectedText + suffix
      const nav = this.treeNav

      // QA 模式下选中的是回答内容 → 问题创建在回答节点下
      // 普通模式下 → 问题创建在当前节点下
      const parentId = (this.qaTitle && this.answerNodeId) ? this.answerNodeId : this.currentNodeId

      try {
        // 1. 创建问题子节点
        const questionNodeId = nav.createChildNode(parentId, questionText)
        if (!questionNodeId) throw new Error('创建问题节点失败')

        this.onNodeCreated(questionNodeId)

        // 2. 创建 AI 回答子节点
        const answerNodeId = nav.createChildNode(questionNodeId, '🤖 正在思考中...', {
          isAIResponse: true,
          aiStatus: 'loading'
        })
        if (!answerNodeId) throw new Error('创建回答节点失败')

        this.onNodeCreated(answerNodeId)

        // 3. 调用 AI 服务
        const aiService = aiServiceFactory.getService()
        const promptConfig = getCurrentPromptConfig()
        const systemPrompt = promptConfig.getSystemPrompt(false)

        // 构建上下文
        const path = nav.getNodePath(parentId)
        let contextPrompt = ''
        if (path.length > 0) {
          const chainTexts = path.map((item, i) => `${i + 1}. ${item.text}`).join('\n')
          contextPrompt = `**导图层级上下文**\n请严格参考下面的节点链路：\n${chainTexts}\n\n要求：回答必须承接链路中的上级语义，避免偏离当前节点主题。`
        }

        const messages = []
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt })
        if (contextPrompt) messages.push({ role: 'system', content: contextPrompt })
        messages.push({ role: 'user', content: questionText })

        // 流式回调
        let accumulatedText = ''
        const onStream = (content) => {
          accumulatedText += content
          nav.updateNodeText(answerNodeId, accumulatedText)
          // 如果当前在 QA 卡且这是对应的回答节点，实时更新
          if (answerNodeId === this.answerNodeId) {
            this.segments = splitContent(accumulatedText)
            if (this.currentSegment >= this.segments.length) {
              this.currentSegment = Math.max(0, this.segments.length - 1)
            }
          }
        }

        const onReasoning = (reasoning) => {
          if (this.$refs.thinkingDrawer) {
            this.$refs.thinkingDrawer.show(reasoning)
          }
        }

        const fullResponse = await aiService.generateResponse(messages, onStream, onReasoning)
        const finalContent = fullResponse || accumulatedText || '回答生成完成'
        nav.updateNodeText(answerNodeId, finalContent)
        nav.updateNodeData(answerNodeId, { aiStatus: 'complete' })

        this.onAnswerComplete({ nodeId: answerNodeId, text: finalContent })

      } catch (err) {
        console.error('[Mobile] 选中文字提问失败:', err)
        this.onAIError(err.message || '生成回答失败')
      }
    },

    // ==================== 工具方法 ====================

    handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // 页面重新可见时刷新数据
        this.treeData = this.treeNav.loadTreeData()
        // 刷新当前卡片的显示
        if (this.currentNodeId) {
          const card = this.cardResolver.resolveCard(this.currentNodeId)
          if (card) {
            this.segments = card.segments
            this.qaTitle = card.title
            this.answerNodeId = card.answerNodeId
            this.breadcrumb = this.cardResolver.getBreadcrumb(card.nodeId)
          }
        }
      }
    },

    vibrate(duration = 10) {
      if (navigator.vibrate) {
        navigator.vibrate(duration)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.mobile-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.card-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-top: calc(56px + env(safe-area-inset-top));
  position: relative;
}

// 过渡动画
.slide-up-enter-active,
.slide-up-leave-active,
.slide-down-enter-active,
.slide-down-leave-active,
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(40px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-40px);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-40px);
}
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(40px);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

// 节点标题（在 transition 外，切段时不显隐）
.card-node-name {
  flex-shrink: 0;
  padding: 0 20px 8px;
  font-size: 13px;
  color: #7a7a90;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;

  // QA 合并模式：标题更醒目
  &.qa-title {
    padding: 12px 20px 12px;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a2e;
    white-space: normal;
    line-height: 1.5;
    border-bottom: 1px solid #f0f0f6;
    background: linear-gradient(135deg, #f0f7ff 0%, #fafaff 100%);
    border-radius: 12px 12px 0 0;
    margin: -8px 0 0 0;
    display: flex;
    align-items: flex-start;
    gap: 8px;

    .qa-icon {
      font-size: 18px;
      flex-shrink: 0;
      margin-top: 1px;
    }
  }
}

// 右侧导航区：兄弟节点箭头 + 段指示圆点
.side-nav {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 10;
}

.sibling-arrow {
  font-size: 13px;
  color: #a0a0b8;
  padding: 8px 6px;
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s;
  user-select: none;

  &:active {
    color: #409eff;
  }

  &.disabled {
    color: #e0e0e8;
    cursor: default;
    pointer-events: none;
  }
}

// 段指示竖排圆点
.segment-dots {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 4px;

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #d0d0d8;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    flex-shrink: 0;

    &:active {
      background: #7eb8f0;
    }

    &.active {
      background: #409eff;
      transform: scale(1.7);
      box-shadow: 0 0 4px rgba(64, 158, 255, 0.4);
    }
  }
}

// 全局移动端样式重置
.mobile-page * {
  -webkit-tap-highlight-color: transparent;
}
</style>

<!-- 全局：禁止原生下拉刷新 -->
<style>
html, body {
  overscroll-behavior: none;
}
</style>
