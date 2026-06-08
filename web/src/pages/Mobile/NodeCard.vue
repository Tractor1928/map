<template>
  <div
    class="node-card"
    ref="cardEl"
    @touchstart.passive="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- 顶部导航指示 -->
    <div class="card-nav-indicators">
      <!-- 父节点提示 -->
      <div class="nav-hint left" v-if="hasParent" @click.stop="$emit('back-parent')">
        <span class="hint-arrow">←</span>
        <span class="hint-label">返回上级</span>
        <kbd>←</kbd>
      </div>
      <div class="nav-hint left disabled" v-else>
        <span class="hint-arrow" style="opacity:0.2">←</span>
      </div>

      <!-- 子节点提示 -->
      <div class="nav-hint right" v-if="hasChildren" @click.stop="$emit('enter-child')">
        <kbd>→</kbd>
        <span class="hint-label">进入子节点</span>
        <span class="hint-arrow">→</span>
      </div>
      <div class="nav-hint right disabled" v-else>
        <span class="hint-arrow" style="opacity:0.2">→</span>
      </div>
    </div>

    <!-- 段落内容 -->
    <div class="card-body">
      <NodeCardContent
        :segment="currentSegmentData"
        :total-segments="segments.length"
        @text-selected="$emit('text-selected', $event)"
      />
    </div>

  </div>
</template>

<script>
import NodeCardContent from './NodeCardContent.vue'

export default {
  name: 'NodeCard',
  components: {
    NodeCardContent
  },
  props: {
    /** 当前节点数据 */
    nodeData: {
      type: Object,
      default: () => null
    },
    /** 分段后的内容数组 */
    segments: {
      type: Array,
      default: () => []
    },
    /** 当前段落索引 */
    currentSegment: {
      type: Number,
      default: 0
    },
    hasNextSegment: Boolean,
    hasPrevSegment: Boolean,
    hasChildren: Boolean,
    hasParent: Boolean
  },
  emits: [
    'next-segment', 'prev-segment',
    'next-sibling', 'prev-sibling',
    'enter-child', 'back-parent',
    'swipe', 'text-selected'
  ],
  computed: {
    currentSegmentData() {
      if (this.segments.length > 0 && this.segments[this.currentSegment]) {
        return this.segments[this.currentSegment]
      }
      return { title: '', content: '', index: 0 }
    }
  },
  data() {
    return {
      touchStartX: 0,
      touchStartY: 0,
      touchStartTime: 0
    }
  },
  mounted() {
    this._dumpLayout('mounted')
  },
  updated() {
    this._dumpLayout('updated')
  },
  methods: {
    _dumpLayout(tag) {
      this.$nextTick(() => {
        const mobilePage = document.querySelector('.mobile-page')
        const cardArea = this.$el && this.$el.closest('.card-area')
        const chatBar = document.querySelector('.bottom-chat-bar')
        const cardBody = this.$el && this.$el.querySelector('.card-body')
        if (!mobilePage || !cardArea || !chatBar || !cardBody) return

        const mp = mobilePage.getBoundingClientRect()
        const ca = cardArea.getBoundingClientRect()
        const cb = chatBar.getBoundingClientRect()
        const body = cardBody.getBoundingClientRect()

        console.log('[NodeCard:layout:' + tag + ']', {
          'mobilePage.h': Math.round(mp.height),
          'cardArea.top': Math.round(ca.top), 'cardArea.bottom': Math.round(ca.bottom), 'cardArea.h': Math.round(ca.height),
          'chatBar.top': Math.round(cb.top), 'chatBar.bottom': Math.round(cb.bottom), 'chatBar.h': Math.round(cb.height),
          'cardBody.top': Math.round(body.top), 'cardBody.bottom': Math.round(body.bottom), 'cardBody.h': Math.round(body.height),
          'cardBody.scrollH': cardBody.scrollHeight, 'cardBody.clientH': cardBody.clientHeight,
          overlap: Math.round(body.bottom - cb.top)
        })
      })
    },
    onTouchStart(e) {
      const touch = e.touches[0]
      this.touchStartX = touch.clientX
      this.touchStartY = touch.clientY
      this.touchStartTime = Date.now()
    },

    onTouchMove(e) {
      // 检测是否水平滑动，阻止页面滚动
      if (!this.touchStartX) return
      const touch = e.touches[0]
      const dx = Math.abs(touch.clientX - this.touchStartX)
      const dy = Math.abs(touch.clientY - this.touchStartY)
      if (dx > 20 && dx > dy * 1.2) {
        e.preventDefault()
      }
    },

    onTouchEnd(e) {
      const touch = e.changedTouches[0]
      const dx = touch.clientX - this.touchStartX
      const dy = touch.clientY - this.touchStartY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      const elapsed = Date.now() - this.touchStartTime
      const threshold = 60
      const maxTime = 350

      // 重置
      this.touchStartX = 0
      this.touchStartY = 0

      // 时间过长忽略
      if (elapsed > maxTime) return

      // 距离不够忽略
      if (absDx < threshold && absDy < threshold) return

      // 判断方向
      if (absDy > absDx) {
        // 垂直滑动：只有内容滚到头才切段
        const scrollEl = this.$el && this.$el.querySelector('.card-body')
        const atTop = scrollEl ? scrollEl.scrollTop <= 5 : true
        const atBottom = scrollEl
          ? scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 5
          : true

        if (dy < -threshold) {
          // 上滑 → 内容滚到底后切下一段
          if (!atBottom) return
          if (this.hasNextSegment) {
            this.$emit('next-segment')
          } else {
            this.$emit('next-sibling')
          }
        } else if (dy > threshold) {
          // 下滑 → 内容滚到顶后切上一段
          if (!atTop) return
          if (this.hasPrevSegment) {
            this.$emit('prev-segment')
          } else {
            this.$emit('prev-sibling')
          }
        }
      } else {
        // 水平滑动：左滑前进（进入子节点），右滑后退（返回父节点）
        if (dx < -threshold) {
          // 左滑 → 进入子节点
          if (this.hasChildren) {
            this.$emit('enter-child')
          }
        } else if (dx > threshold) {
          // 右滑 → 返回父节点
          if (this.hasParent) {
            this.$emit('back-parent')
          }
        }
      }
    }
  }
}
</script>

<style lang="less" scoped>
.node-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  touch-action: pan-y; // 允许垂直滚动，水平手势用于导航
}

// 导航指示器
.card-nav-indicators {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  flex-shrink: 0;
}

.nav-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #409eff;
  cursor: pointer;
  transition: background 0.15s;

  &:active {
    background: #e8f4ff;
  }

  &.disabled {
    cursor: default;
    color: #c0c0d0;

    &:active {
      background: transparent;
    }
  }

  .hint-arrow {
    font-size: 14px;
    font-weight: 600;
  }

  .hint-label {
    font-weight: 500;
  }

  kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 18px;
    padding: 0 4px;
    border: 1px solid #d0d0d8;
    border-radius: 4px;
    background: #f5f5fa;
    font-size: 10px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #7a7a90;
    box-shadow: 0 1px 0 #d0d0d8;
  }

}

// 节点名称（截断显示）
// 段落内容区
.card-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  min-height: 0;
}

</style>
