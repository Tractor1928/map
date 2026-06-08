<template>
  <div
    class="node-card"
    ref="cardEl"
    @touchstart.passive="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
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
  methods: {
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
  flex: 1;
  min-height: 0;
  background: #fff;
  touch-action: pan-y; // 允许垂直滚动，水平手势用于导航
}

// 段落内容区
.card-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
  min-height: 0;
}

</style>
