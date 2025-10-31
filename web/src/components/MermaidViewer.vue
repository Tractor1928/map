<template>
  <div class="mermaid-viewer">
    <div class="mermaid-header">
      <span class="mermaid-title">📊 Mermaid图表</span>
      <div class="mermaid-actions">
        <button @click="toggleView" class="action-btn">
          {{ showRendered ? '查看源码' : '查看图表' }}
        </button>
        <button @click="copyCode" class="action-btn">复制代码</button>
      </div>
    </div>
    
    <div class="mermaid-content">
      <!-- 渲染的图表 -->
      <div 
        v-if="showRendered && !renderError" 
        class="mermaid-chart"
        :id="chartId"
        ref="chartContainer"
      ></div>
      
      <!-- 渲染错误提示 -->
      <div v-if="showRendered && renderError" class="mermaid-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">
          <p>图表渲染失败</p>
          <p class="error-detail">{{ renderError }}</p>
          <button @click="showRendered = false" class="error-action">查看源码</button>
        </div>
      </div>
      
      <!-- 源码显示 -->
      <div v-if="!showRendered" class="mermaid-source">
        <pre><code>{{ mermaidCode }}</code></pre>
      </div>
    </div>
  </div>
</template>

<script>
import mermaid from 'mermaid'

export default {
  name: 'MermaidViewer',
  props: {
    code: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      showRendered: true,
      renderError: null,
      chartId: `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  },
  computed: {
    mermaidCode() {
      return this.code.trim()
    }
  },
  mounted() {
    this.initMermaid()
    this.renderChart()
  },
  watch: {
    code() {
      this.renderChart()
    },
    showRendered(newVal) {
      if (newVal && !this.renderError) {
        this.$nextTick(() => {
          this.renderChart()
        })
      }
    }
  },
  methods: {
    initMermaid() {
      // 初始化Mermaid配置
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        themeVariables: {
          primaryColor: '#3b82f6',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#2563eb',
          lineColor: '#6b7280',
          secondaryColor: '#f3f4f6',
          tertiaryColor: '#ffffff'
        },
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        },
        sequence: {
          useMaxWidth: true,
          wrap: true
        },
        gantt: {
          useMaxWidth: true
        }
      })
    },
    
    async renderChart() {
      if (!this.showRendered || !this.mermaidCode) return
      
      try {
        this.renderError = null
        
        // 清空容器
        const container = this.$refs.chartContainer
        if (container) {
          container.innerHTML = ''
        }
        
        // 等待DOM更新
        await this.$nextTick()
        
        // 验证Mermaid语法
        const isValid = await mermaid.parse(this.mermaidCode)
        if (!isValid) {
          throw new Error('Mermaid语法错误')
        }
        
        // 渲染图表
        const { svg } = await mermaid.render(this.chartId, this.mermaidCode)
        
        if (container) {
          container.innerHTML = svg
          
          // 优化SVG样式
          const svgElement = container.querySelector('svg')
          if (svgElement) {
            svgElement.style.maxWidth = '100%'
            svgElement.style.height = 'auto'
            svgElement.style.display = 'block'
            svgElement.style.margin = '0 auto'
          }
        }
        
      } catch (error) {
        console.error('Mermaid渲染错误:', error)
        this.renderError = error.message || '未知渲染错误'
      }
    },
    
    toggleView() {
      this.showRendered = !this.showRendered
    },
    
    async copyCode() {
      try {
        await navigator.clipboard.writeText(this.mermaidCode)
        this.$message?.success('代码已复制到剪贴板')
      } catch (error) {
        console.error('复制失败:', error)
        // 降级方案
        const textArea = document.createElement('textarea')
        textArea.value = this.mermaidCode
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        this.$message?.success('代码已复制到剪贴板')
      }
    }
  }
}
</script>

<style scoped>
.mermaid-viewer {
  border: 2px solid #10b981;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(16, 185, 129, 0.08);
  margin: 12px 0;
}

.mermaid-header {
  background: #10b981;
  color: white;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mermaid-title {
  font-size: 12px;
  font-weight: bold;
}

.mermaid-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.mermaid-content {
  padding: 16px;
  background: white;
  min-height: 100px;
}

.mermaid-chart {
  text-align: center;
  overflow-x: auto;
}

.mermaid-source {
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
}

.mermaid-source pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.5;
  font-size: 13px;
  color: #1f2937;
}

.mermaid-error {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  color: #dc2626;
}

.error-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.error-message p {
  margin: 0 0 4px 0;
}

.error-detail {
  font-size: 12px;
  color: #7f1d1d;
  font-family: monospace;
}

.error-action {
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  margin-top: 8px;
}

.error-action:hover {
  background: #b91c1c;
}
</style>
