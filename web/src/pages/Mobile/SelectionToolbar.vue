<template>
  <div
    class="selection-toolbar"
    v-show="visible"
    :style="toolbarStyle"
    @click.stop
  >
    <div class="toolbar-btn question-btn" @click="onAsk" :title="'选中文字提问'">
      <span class="btn-icon">?</span>
    </div>
    <div class="toolbar-divider"></div>
    <div class="toolbar-btn howto-btn" @click="onAskHowTo" :title="'问这是怎么实现的'">
      <span class="btn-text">怎么实现的？</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SelectionToolbar',
  props: {
    /** 是否显示 */
    visible: {
      type: Boolean,
      default: false
    },
    /** 选中文本 */
    selectedText: {
      type: String,
      default: ''
    },
    /** 选中区域的边界 rect */
    selectionRect: {
      type: Object,
      default: null
    }
  },
  emits: ['ask', 'ask-howto'],
  computed: {
    toolbarStyle() {
      if (!this.visible || !this.selectionRect) return { display: 'none' }
      // 定位在选中文字上方居中
      const top = this.selectionRect.top - 50
      const left = this.selectionRect.left + this.selectionRect.width / 2
      return {
        top: Math.max(20, top) + 'px',
        left: left + 'px'
      }
    }
  },
  methods: {
    onAsk() {
      // 桌面端默认拼接问号:
      // createQuestionNodeFromSelection(selectedText, suffix = '?')
      this.$emit('ask', this.selectedText)
    },
    onAskHowTo() {
      // 桌面端:
      // createQuestionNodeFromSelection(selectedText, '是怎么实现的？')
      this.$emit('ask-howto', this.selectedText)
    }
  }
}
</script>

<style lang="less" scoped>
.selection-toolbar {
  position: fixed;
  z-index: 3000;
  display: flex;
  align-items: center;
  height: 40px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateX(-50%);
  padding: 0 4px;
  animation: toolbarIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes toolbarIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  cursor: pointer;
  border-radius: 16px;
  padding: 0 12px;
  transition: all 0.15s;

  &:active {
    transform: scale(0.95);
  }
}

.question-btn {
  width: 32px;
  padding: 0;
  background: #1890ff;
  border-radius: 50%;

  .btn-icon {
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
  }

  &:active {
    background: #177ce2;
  }
}

.howto-btn {
  margin-left: 4px;
  background: #fff7e6;
  border: 1px solid #ffd591;

  .btn-text {
    font-size: 13px;
    color: #fa8c16;
    font-weight: 500;
    white-space: nowrap;
  }

  &:active {
    background: #ffe7ba;
  }
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e8e8ef;
  margin: 0 4px;
}
</style>
