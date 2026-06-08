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

      <!-- 中间：段内导航 -->
      <div class="nav-hint center" v-if="segments.length > 1">
        <kbd>↑</kbd>
        <span class="hint-label">上下翻段</span>
        <kbd>↓</kbd>
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

    <!-- 节点名称 -->
    <div class="card-node-name" v-if="nodeTitle">
      {{ nodeTitle }}
    </div>

    <!-- 段落内容 -->
    <div class="card-body">
      <NodeCardContent
        :segment="currentSegmentData"
        :total-segments="segments.length"
      />
    </div>

    <!-- 底部导航区 -->
    <div class="card-footer">
      <!-- 段内导航 -->
      <div class="segment-nav">
        <button
          class="seg-nav-btn"
          :class="{ disabled: !hasPrevSegment }"
          @click="$emit('prev-segment')"
        >
          ↑ 上一段
        </button>
        <span class="seg-indicator" v-if="segments.length > 1">
          {{ currentSegment + 1 }} / {{ segments.length }}
        </span>
        <button
          class="seg-nav-btn"
          :class="{ disabled: !hasNextSegment }"
          @click="$emit('next-segment')"
        >
          下一段 ↓
        </button>
      </div>

      <!-- 兄弟节点预览 -->
      <div class="sibling-preview" v-if="siblingPreview">
        <div class="sibling-item prev" v-if="siblingPreview.prev" @click="$emit('prev-sibling')">
          <span class="sibling-label">上一条</span>
          <span class="sibling-text">{{ siblingPreview.prev.text }}</span>
        </div>
        <div class="sibling-item current">
          <span class="sibling-label">当前</span>
          <span class="sibling-text">{{ siblingPreview.current.text }}</span>
        </div>
        <div class="sibling-item next" v-if="siblingPreview.next" @click="$emit('next-sibling')">
          <span class="sibling-label">下一条</span>
          <span class="sibling-text">{{ siblingPreview.next.text }}</span>
        </div>
      </div>
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
    /** 节点标题（原文提取的简短标题） */
    nodeTitle: {
      type: String,
      default: ''
    },
    hasNextSegment: Boolean,
    hasPrevSegment: Boolean,
    hasChildren: Boolean,
    hasParent: Boolean,
    /** 兄弟节点预览 { prev, current, next } */
    siblingPreview: {
      type: Object,
      default: () => null
    }
  },
  emits: [
    'next-segment', 'prev-segment',
    'next-sibling', 'prev-sibling',
    'enter-child', 'back-parent',
    'swipe'
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
        // 垂直滑动
        if (dy < -threshold) {
          // 上滑
          if (this.hasNextSegment) {
            this.$emit('next-segment')
          } else {
            this.$emit('next-sibling')
          }
        } else if (dy > threshold) {
          // 下滑
          if (this.hasPrevSegment) {
            this.$emit('prev-segment')
          } else {
            this.$emit('prev-sibling')
          }
        }
      } else {
        // 水平滑动
        if (dx > threshold) {
          // 右滑 → 进入子节点
          if (this.hasChildren) {
            this.$emit('enter-child')
          }
        } else if (dx < -threshold) {
          // 左滑 → 返回父节点
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
  user-select: none;
  -webkit-user-select: none;
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

  &.center {
    cursor: default;
    color: #7a7a90;
    gap: 6px;

    &:active {
      background: transparent;
    }
  }
}

// 节点名称（截断显示）
.card-node-name {
  padding: 0 20px 8px;
  font-size: 13px;
  color: #7a7a90;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

// 段落内容区
.card-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
}

// 底部区域
.card-footer {
  flex-shrink: 0;
  padding: 10px 16px 0;
  border-top: 1px solid #f0f0f6;
}

// 段内导航按钮
.segment-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  .seg-nav-btn {
    flex: 1;
    padding: 10px 8px;
    border: 1px solid #e0e0e8;
    border-radius: 10px;
    background: #fafafc;
    font-size: 13px;
    color: #4a5568;
    cursor: pointer;
    transition: all 0.15s;

    &:active {
      background: #e8f4ff;
      border-color: #409eff;
      color: #409eff;
    }

    &.disabled {
      opacity: 0.35;
      cursor: default;

      &:active {
        background: #fafafc;
        border-color: #e0e0e8;
        color: #4a5568;
      }
    }
  }

  .seg-indicator {
    font-size: 13px;
    font-weight: 600;
    color: #409eff;
    white-space: nowrap;
    padding: 0 8px;
  }
}

// 兄弟节点预览
.sibling-preview {
  display: flex;
  gap: 6px;
  padding: 12px 0;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.sibling-item {
  flex: 1;
  min-width: 0;
  padding: 10px 10px;
  border-radius: 10px;
  background: #f5f5fa;
  cursor: pointer;
  transition: background 0.15s;

  &:active {
    background: #e8f4ff;
  }

  &.current {
    background: #409eff;
    cursor: default;
    flex: 1.2;

    .sibling-label {
      color: rgba(255, 255, 255, 0.7);
    }

    .sibling-text {
      color: #fff;
    }
  }

  .sibling-label {
    display: block;
    font-size: 10px;
    color: #a0a0b0;
    margin-bottom: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .sibling-text {
    display: block;
    font-size: 13px;
    color: #333;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
