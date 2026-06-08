<template>
  <div class="bottom-chat-bar" :class="{ expanded: isExpanded }">
    <!-- 思考中指示器 -->
    <div class="thinking-indicator" v-if="isThinking">
      <span class="thinking-dot"></span>
      <span class="thinking-label">AI 正在思考...</span>
      <span class="thinking-cancel" @click="cancelThinking">取消</span>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-area">
      <div class="input-wrapper">
        <textarea
          ref="inputRef"
          class="chat-input"
          v-model="question"
          :placeholder="placeholder"
          rows="1"
          @focus="isExpanded = true"
          @input="autoResize"
          @keydown.enter.exact="handleSubmit"
        ></textarea>
        <button
          class="send-btn"
          :class="{ disabled: !canSend, active: canSend }"
          :disabled="!canSend"
          @click="handleSubmit"
        >
          <span v-if="!isThinking">↑</span>
          <span v-else class="loading-spin">⏳</span>
        </button>
      </div>

      <!-- 展开后的提示 -->
      <div class="input-hint" v-if="isExpanded">
        <span>输入问题，AI 将在此节点下生成回答</span>
      </div>
    </div>
  </div>
</template>

<script>
import { aiServiceFactory } from '@/services/ai'
import { getCurrentPromptConfig } from '@/config/aiPrompts'

export default {
  name: 'BottomChatBar',
  props: {
    /** 当前节点 ID */
    currentNodeId: {
      type: String,
      default: ''
    },
    /** QA 合并模式下的回答节点 ID（存在时，新问题应挂在回答节点下） */
    answerNodeId: {
      type: String,
      default: ''
    },
    /** 当前节点文本（简短显示） */
    nodeText: {
      type: String,
      default: ''
    },
    /** 树导航器实例 */
    treeNav: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      question: '',
      isExpanded: false,
      isThinking: false,
      abortController: null
    }
  },
  computed: {
    canSend() {
      return this.question.trim().length > 0 && !this.isThinking && this.currentNodeId
    },
    placeholder() {
      if (this.isThinking) return 'AI 正在思考中...'
      return '输入问题，AI 将为你解答...'
    }
  },
  methods: {
    autoResize() {
      const el = this.$refs.inputRef
      if (!el) return
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    },

    async handleSubmit(e) {
      if (e) {
        e.preventDefault()
      }
      if (!this.canSend || !this.treeNav) return

      const questionText = this.question.trim()
      this.question = ''
      this.isExpanded = false
      this.isThinking = true

      // 重置输入框高度
      if (this.$refs.inputRef) {
        this.$refs.inputRef.style.height = 'auto'
      }

      try {
        await this.generateAIAnswer(questionText)
      } catch (err) {
        console.error('[BottomChatBar] AI 回答生成失败:', err)
        this.$emit('error', err.message || '生成回答失败')
      } finally {
        this.isThinking = false
      }
    },

    async generateAIAnswer(questionText) {
      const nav = this.treeNav
      // QA 模式下挂在回答节点下（形成 Q→A→Q→A 链），普通模式挂当前节点下
      const parentId = this.answerNodeId || this.currentNodeId

      // 1. 创建问题子节点
      const questionNodeId = nav.createChildNode(parentId, questionText)
      if (!questionNodeId) {
        throw new Error('创建问题节点失败')
      }

      // 通知父组件新节点已创建
      this.$emit('node-created', questionNodeId)

      // 2. 创建 AI 回答子节点（初始加载状态）
      const answerNodeId = nav.createChildNode(questionNodeId, '🤖 正在思考中...', {
        isAIResponse: true,
        aiStatus: 'loading'
      })
      if (!answerNodeId) {
        throw new Error('创建 AI 回答节点失败')
      }

      this.$emit('node-created', answerNodeId)

      // 3. 调用 AI 服务
      const aiService = aiServiceFactory.getService()

      // 构建消息
      const promptConfig = getCurrentPromptConfig()
      const systemPrompt = promptConfig.getSystemPrompt(false)

      // 收集上下文（父链）
      const contextPrompt = this.buildContext(parentId, nav)

      const messages = []
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt })
      }
      if (contextPrompt) {
        messages.push({ role: 'system', content: contextPrompt })
      }
      messages.push({ role: 'user', content: questionText })

      // 流式回调
      let accumulatedText = ''
      const onStream = (content) => {
        accumulatedText += content
        nav.updateNodeText(answerNodeId, accumulatedText)
        // 通知父组件内容更新
        this.$emit('answer-updating', { nodeId: answerNodeId, text: accumulatedText })
      }

      const onReasoning = (reasoning) => {
        this.$emit('reasoning-update', reasoning)
      }

      // 执行请求
      try {
        const fullResponse = await aiService.generateResponse(messages, onStream, onReasoning)
        const finalContent = fullResponse || accumulatedText || '回答生成完成'
        nav.updateNodeText(answerNodeId, finalContent)
        nav.updateNodeData(answerNodeId, { aiStatus: 'complete' })

        this.$emit('answer-complete', { nodeId: answerNodeId, text: finalContent })
        return answerNodeId
      } catch (err) {
        // 更新为错误状态
        nav.updateNodeText(answerNodeId, `❌ AI 回答生成失败: ${err.message || '未知错误'}`)
        nav.updateNodeData(answerNodeId, { aiStatus: 'error' })
        throw err
      }
    },

    buildContext(nodeId, nav) {
      // 获取父链作为上下文
      const path = nav.getNodePath(nodeId)
      if (path.length <= 1) return ''

      const chainTexts = path.map((item, index) => `${index + 1}. ${item.text}`).join('\n')

      // 检查父节点是否是 AI 回答
      const parent = nav.getParent(nodeId)
      let parentAnswerHint = ''
      if (parent) {
        const parentNode = nav.findNode(parent.id)
        if (parentNode && parentNode.data && parentNode.data.isAIResponse) {
          const parentText = nav._getNodeText(parentNode)
          if (parentText) {
            parentAnswerHint = `\n上级AI回答摘要：${parentText.substring(0, 200)}`
          }
        }
      }

      return `**导图层级上下文（按父子链）**
请严格参考下面的节点链路，保持语义连续并沿该链条展开：
${chainTexts}${parentAnswerHint}

要求：
- 回答必须承接链路中的上级语义
- 避免偏离当前节点主题
- 保持层级递进与结构一致`
    },

    cancelThinking() {
      if (this.abortController) {
        this.abortController.abort()
      }
      this.isThinking = false
    }
  }
}
</script>

<style lang="less" scoped>
.bottom-chat-bar {
  flex-shrink: 0;
  padding: 4px 12px 10px;
  // iPhone 安全区域
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, #fff 30%, transparent);
  transition: padding 0.2s ease;
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  margin-bottom: 8px;
  background: #f0f7ff;
  border-radius: 20px;
  font-size: 13px;
  color: #409eff;
  animation: pulse 2s ease-in-out infinite;

  .thinking-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #409eff;
    animation: blink 1s ease-in-out infinite;
  }

  .thinking-label {
    flex: 1;
    font-weight: 500;
  }

  .thinking-cancel {
    color: #9090a0;
    cursor: pointer;
    padding: 2px 8px;

    &:active {
      color: #e04060;
    }
  }
}

.chat-input-area {
  background: #f5f5fa;
  border-radius: 24px;
  padding: 6px 6px 6px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.chat-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  line-height: 1.4;
  color: #333;
  resize: none;
  outline: none;
  max-height: 120px;
  padding: 4px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  &::placeholder {
    color: #b0b0c0;
  }
}

.send-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &.disabled {
    background: #e0e0e8;
    color: #b0b0c0;
  }

  &.active {
    background: #409eff;
    color: #fff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);

    &:active {
      transform: scale(0.92);
    }
  }
}

.loading-spin {
  animation: spin 1s linear infinite;
}

.input-hint {
  padding: 6px 4px 0;
  font-size: 12px;
  color: #a0a0b0;

  em {
    font-style: normal;
    color: #409eff;
    font-weight: 500;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
