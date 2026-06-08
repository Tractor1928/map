<template>
  <transition name="drawer-slide">
    <div class="thinking-drawer" v-if="visible">
      <div class="drawer-handle" @click="toggle">
        <span class="handle-bar"></span>
      </div>
      <div class="drawer-header">
        <span class="drawer-title">🧠 思考过程</span>
        <span class="drawer-close" @click="visible = false">收起</span>
      </div>
      <div class="drawer-body customScrollbar">
        <pre class="thinking-text">{{ content }}</pre>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ThinkingDrawer',
  data() {
    return {
      visible: false,
      content: ''
    }
  },
  methods: {
    show(text) {
      this.content = text || ''
      if (this.content) {
        this.visible = true
      }
    },
    hide() {
      this.visible = false
      this.content = ''
    },
    toggle() {
      this.visible = !this.visible
    },
    append(text) {
      this.content += text
      if (!this.visible && this.content) {
        this.visible = true
      }
    }
  }
}
</script>

<style lang="less" scoped>
.thinking-drawer {
  position: fixed;
  bottom: 80px;
  left: 0;
  right: 0;
  max-height: 40vh;
  background: #fff;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

.drawer-handle {
  display: flex;
  justify-content: center;
  padding: 10px 0 4px;
  cursor: pointer;

  .handle-bar {
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: #d0d0d8;
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px 12px;
  border-bottom: 1px solid #f0f0f6;

  .drawer-title {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a2e;
  }

  .drawer-close {
    font-size: 13px;
    color: #9090a0;
    cursor: pointer;
    padding: 4px 8px;

    &:active {
      color: #409eff;
    }
  }
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  -webkit-overflow-scrolling: touch;
}

.thinking-text {
  font-size: 13px;
  line-height: 1.6;
  color: #555;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

// 过渡动画
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.drawer-slide-enter,
.drawer-slide-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
