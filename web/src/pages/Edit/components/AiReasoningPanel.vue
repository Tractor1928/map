<template>
  <div>
    <!-- 思考过程抽屉（节点AI自动生成链路） -->
    <div
      class="reasoningDrawerTrigger"
      v-if="reasoningContent"
      @click="reasoningDrawerVisible = !reasoningDrawerVisible"
    >
      {{ reasoningDrawerVisible ? '收起思考过程' : '查看思考过程' }}
    </div>
    <div class="reasoningDrawer" v-show="reasoningDrawerVisible">
      <div class="reasoningDrawerHeader">
        <span>思考过程</span>
        <el-button
          type="text"
          class="reasoningCloseBtn"
          @click="reasoningDrawerVisible = false"
        >
          收起
        </el-button>
      </div>
      <div class="reasoningDrawerBody customScrollbar">
        <pre :style="reasoningTextStyle">{{ reasoningContent }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    mindMap: {
      type: Object
    }
  },
  data() {
    return {
      reasoningContent: '',
      reasoningDrawerVisible: false
    }
  },
  computed: {
    reasoningTextStyle() {
      const fontFamily =
        this.mindMap && this.mindMap.getThemeConfig
          ? this.mindMap.getThemeConfig('fontFamily')
          : ''
      return {
        fontFamily: fontFamily || 'inherit'
      }
    }
  },
  created() {
    this.$bus.$on('ai_reasoning_update', this.handleAIReasoningUpdate)
    this.$bus.$on('ai_reasoning_reset', this.resetAIReasoning)
  },
  beforeDestroy() {
    this.$bus.$off('ai_reasoning_update', this.handleAIReasoningUpdate)
    this.$bus.$off('ai_reasoning_reset', this.resetAIReasoning)
  },
  methods: {
    handleAIReasoningUpdate(reasoning = '') {
      this.reasoningContent = reasoning || ''
      if (this.reasoningContent) {
        this.reasoningDrawerVisible = true
      }
    },
    resetAIReasoning() {
      this.reasoningContent = ''
      this.reasoningDrawerVisible = false
    }
  }
}
</script>

<style lang="less" scoped>
.reasoningDrawerTrigger {
  position: fixed;
  right: 20px;
  bottom: 70px;
  z-index: 99999;
  background: #409eff;
  color: #fff;
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.reasoningDrawer {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 60px;
  width: min(900px, calc(100vw - 32px));
  height: 260px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  z-index: 99999;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;

  .reasoningDrawerHeader {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;
    border-bottom: 1px solid #ebeef5;
    font-size: 13px;
    font-weight: 600;

    .reasoningCloseBtn {
      font-size: 12px;
    }
  }

  .reasoningDrawerBody {
    flex: 1;
    padding: 12px;
    overflow-y: auto;

    pre {
      white-space: pre-wrap;
      word-break: break-word;
      margin: 0;
      font-size: 13px;
      line-height: 1.6;
    }
  }
}
</style>
