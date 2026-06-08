<template>
  <div class="node-card-content">
    <!-- 段落标题 -->
    <div class="segment-title" v-if="segment.title">
      {{ segment.title }}
    </div>

    <!-- 段落正文 -->
    <div class="segment-body" ref="segmentBody">
      <!-- Markdown 渲染内容 -->
      <div
        class="markdown-content customScrollbar"
        v-if="renderedHtml"
        v-html="renderedHtml"
      ></div>
      <!-- 纯文本回退 -->
      <div class="plain-content" v-else>
        {{ segment.content }}
      </div>
    </div>
  </div>
</template>

<script>
const marked = require('marked')

export default {
  name: 'NodeCardContent',
  props: {
    /** 段落数据 { title, content, index } */
    segment: {
      type: Object,
      required: true,
      default: () => ({ title: '', content: '', index: 0 })
    },
    /** 总共多少段 */
    totalSegments: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      renderedHtml: ''
    }
  },
  watch: {
    segment: {
      immediate: true,
      handler() {
        this.renderContent()
      }
    }
  },
  methods: {
    renderContent() {
      const text = this.segment.content || ''
      if (!text) {
        this.renderedHtml = ''
        return
      }

      // 检测是否包含 Markdown 格式
      if (this.hasMarkdownFormat(text)) {
        try {
          this.renderedHtml = this.markdownToHtml(text)
        } catch (e) {
          console.warn('[NodeCardContent] Markdown 渲染失败:', e)
          this.renderedHtml = ''
        }
      } else {
        this.renderedHtml = ''
      }
    },

    hasMarkdownFormat(text) {
      const patterns = [
        /^#{1,6}\s+/m,           // 标题
        /\*\*[^*]+\*\*/,         // 粗体
        /\*[^*]+\*/,             // 斜体
        /\[([^\]]+)\]\(([^)]+)\)/, // 链接
        /^[-*+]\s+/m,            // 无序列表
        /^\d+\.\s+/m,            // 有序列表
        /```[\s\S]*?```/,        // 代码块
        /`[^`]+`/,               // 行内代码
        /^>\s+/m,                // 引用
        /^\|.+\|/m,              // 表格
        /~~[^~]+~~/              // 删除线
      ]
      return patterns.some(p => p.test(text))
    },

    markdownToHtml(markdown) {
      let html = ''
      if (typeof marked === 'function') {
        html = marked(markdown)
      } else if (marked.marked && typeof marked.marked === 'function') {
        html = marked.marked(markdown)
      } else if (marked.parse && typeof marked.parse === 'function') {
        html = marked.parse(markdown)
      } else {
        return ''
      }

      // 添加移动端友好的样式类
      html = this.enhanceMarkdownHtml(html)
      return html
    },

    enhanceMarkdownHtml(html) {
      // 创建临时容器
      const div = document.createElement('div')
      div.innerHTML = html

      // 代码块添加复制按钮和语言标识
      const codeBlocks = div.querySelectorAll('pre code')
      codeBlocks.forEach(code => {
        const pre = code.parentElement
        // 检测语言
        const className = code.className || ''
        const langMatch = className.match(/language-(\w+)/)
        const lang = langMatch ? langMatch[1] : ''

        if (lang) {
          const header = document.createElement('div')
          header.className = 'code-lang-header'
          header.textContent = lang.toUpperCase()
          pre.insertBefore(header, code)
        }
      })

      // 表格添加横向滚动
      const tables = div.querySelectorAll('table')
      tables.forEach(table => {
        if (!table.parentElement.classList.contains('table-wrapper')) {
          const wrapper = document.createElement('div')
          wrapper.className = 'table-wrapper'
          table.parentNode.insertBefore(wrapper, table)
          wrapper.appendChild(table)
        }
      })

      return div.innerHTML
    }
  }
}
</script>

<style lang="less" scoped>
.node-card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 24px 20px;
  -webkit-overflow-scrolling: touch;
}

.segment-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e8e8ef;
  line-height: 1.4;
  word-break: break-word;
}

.segment-body {
  flex: 1;
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  word-break: break-word;
}

// Markdown 内容样式
.markdown-content {
  :deep(h1) {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a2e;
    margin: 24px 0 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #eee;
  }

  :deep(h2) {
    font-size: 21px;
    font-weight: 700;
    color: #2d3748;
    margin: 20px 0 10px;
  }

  :deep(h3) {
    font-size: 18px;
    font-weight: 600;
    color: #4a5568;
    margin: 16px 0 8px;
  }

  :deep(h4), :deep(h5), :deep(h6) {
    font-size: 16px;
    font-weight: 600;
    color: #718096;
    margin: 14px 0 6px;
  }

  :deep(p) {
    margin: 10px 0;
    font-size: 16px;
    line-height: 1.8;
  }

  :deep(strong) {
    color: #2d3748;
    font-weight: 700;
  }

  :deep(em) {
    color: #4a5568;
  }

  :deep(ul), :deep(ol) {
    padding-left: 24px;
    margin: 10px 0;

    li {
      margin-bottom: 6px;
      line-height: 1.7;
    }
  }

  :deep(blockquote) {
    border-left: 4px solid #409eff;
    padding: 10px 16px;
    margin: 14px 0;
    background: #f0f7ff;
    border-radius: 0 8px 8px 0;
    color: #5a6a7e;
    font-style: italic;
  }

  :deep(pre) {
    background: #1e1e2e;
    border-radius: 10px;
    margin: 14px 0;
    overflow: hidden;

    .code-lang-header {
      background: #2d2d44;
      color: #a0a0c0;
      padding: 6px 16px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    code {
      display: block;
      padding: 16px;
      font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.5;
      color: #e0e0f0;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }

  :deep(code) {
    background: #f4f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 14px;
    font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
    color: #e04060;
  }

  :deep(pre code) {
    background: transparent;
    padding: 0;
    border-radius: 0;
    color: inherit;
  }

  :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 14px;
  }

  :deep(.table-wrapper) {
    overflow-x: auto;
    margin: 14px 0;
    border-radius: 8px;
    border: 1px solid #e8e8ef;
  }

  :deep(th) {
    background: #f8f8fc;
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    color: #2d3748;
    border-bottom: 2px solid #e0e0f0;
    white-space: nowrap;
  }

  :deep(td) {
    padding: 10px 12px;
    border-bottom: 1px solid #f0f0f6;
    color: #4a5568;
  }

  :deep(a) {
    color: #409eff;
    text-decoration: none;
    border-bottom: 1px dotted #409eff;

    &:active {
      opacity: 0.7;
    }
  }

  :deep(hr) {
    border: none;
    border-top: 1px solid #e8e8ef;
    margin: 20px 0;
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 12px 0;
  }
}

// 纯文本样式
.plain-content {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap;
}
</style>
