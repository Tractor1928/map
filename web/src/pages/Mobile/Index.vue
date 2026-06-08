<template>
  <div class="mobile-page">
    <!-- 顶部导航栏 -->
    <MobileNavBar
      :breadcrumb="breadcrumb"
      :segment-index="currentSegment"
      :segment-total="segments.length"
      @navigate-to="navigateToNode"
      @show-outline="showOutline = true"
      @show-search="showSearch = true"
    />

    <!-- 卡片区域 -->
    <div class="card-area" ref="cardArea">
      <transition :name="transitionName" mode="out-in">
        <NodeCard
          :key="`${currentNodeId}-${currentSegment}`"
          :node-data="currentNode"
          :segments="segments"
          :current-segment="currentSegment"
          :node-title="currentNodeTitle"
          :is-q-a="!!qaTitle"
          :has-next-segment="currentSegment < segments.length - 1"
          :has-prev-segment="currentSegment > 0"
          :has-children="hasChildren"
          :has-parent="hasParent"
          :sibling-preview="siblingPreview"
          @next-segment="handleNextSegment"
          @prev-segment="handlePrevSegment"
          @next-sibling="handleNextSibling"
          @prev-sibling="handlePrevSibling"
          @enter-child="handleEnterChild"
          @back-parent="handleBackParent"
        />
      </transition>
    </div>

    <!-- 底部聊天栏 -->
    <BottomChatBar
      :current-node-id="currentNodeId"
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
  </div>
</template>

<script>
import MobileNavBar from './MobileNavBar.vue'
import NodeCard from './NodeCard.vue'
import BottomChatBar from './BottomChatBar.vue'
import ThinkingDrawer from './ThinkingDrawer.vue'
import { createTreeNavigator } from './useTreeNavigator'
import { createCardResolver } from './useCardResolver'
import { splitContent } from '@/utils/segmentSplitter'

export default {
  name: 'MobileIndex',
  components: {
    MobileNavBar,
    NodeCard,
    BottomChatBar,
    ThinkingDrawer
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

      // 兄弟节点预览
      siblingPreview: null,

      // UI 状态
      showOutline: false,
      showSearch: false,
      loading: true
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
  },
  beforeDestroy() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    document.removeEventListener('keydown', this.handleKeydown)
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

      // 计算兄弟节点预览
      this.siblingPreview = this.cardResolver.getCardSiblings(card.nodeId)

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
      // 新节点已创建，刷新当前卡的兄弟预览
      this.siblingPreview = this.cardResolver.getCardSiblings(this.currentNodeId)
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
        this.siblingPreview = this.cardResolver.getCardSiblings(this.currentNodeId)
      })
    },

    onReasoningUpdate(reasoning) {
      if (this.$refs.thinkingDrawer) {
        this.$refs.thinkingDrawer.show(reasoning)
      }
    },

    onAIError(message) {
      // 可以用 toast 提示
      console.error('[Mobile] AI 错误:', message)
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
            this.siblingPreview = this.cardResolver.getCardSiblings(card.nodeId)
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
  overflow: hidden;
  margin-top: calc(56px + env(safe-area-inset-top));
  margin-bottom: 80px;
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

// 全局移动端样式重置
.mobile-page * {
  -webkit-tap-highlight-color: transparent;
}
</style>
