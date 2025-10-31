/**
 * Mermaid图表渲染测试工具
 * 用于测试AI生成内容中的Mermaid图表渲染功能
 */

// 测试用的Mermaid代码示例
const testMermaidCode = `
🚀 [AI生成] AI服务调用完成，完整回答: 在深入探讨Transformer出现前的技术演进路线之前，让我们先明确这个知识点的**结构层级树**，以便你建立清晰的知识图谱：

### **Transformer之前的序列处理技术演进路线树**

\`\`\`mermaid
graph TD
    A[统计语言模型] --> B[神经网络语言模型]
    B --> C[循环神经网络]
    B --> D[卷积神经网络]
    
    C --> C1[简单RNN]
    C1 --> C2[长短期记忆网络]
    C2 --> C3[门控循环单元]
    
    C3 --> E[编码器-解码器架构<br/>（基于RNN）]
    D --> E
    
    E --> F[引入注意力机制]
    F --> G[...<br/>Transformer革命]
\`\`\`

以下是这棵"技术树"的详细解读：

#### **1. 根基：统计语言模型**

- **本质**：基于概率统计，通过计算词语序列在大型文本库中出现的频率来预测下一个词。
- **核心思想**：一个句子的合理性可以由其中词语共现的概率来度量。最著名的是**N-gram模型**（如二元语法、三元语法）。
`

/**
 * 测试Mermaid渲染功能
 */
function testMermaidRendering() {
  console.log('🧪 [Mermaid测试] 开始测试Mermaid图表渲染功能')
  
  // 模拟AI响应处理
  if (window.Vue && window.Vue.prototype.$aiResponseMixin) {
    const mixin = window.Vue.prototype.$aiResponseMixin
    
    // 测试markdown检测
    const hasMarkdown = mixin.detectMarkdownFormat(testMermaidCode)
    console.log('🧪 [Mermaid测试] Markdown检测结果:', hasMarkdown)
    
    // 测试markdown转换
    if (hasMarkdown) {
      const htmlContent = mixin.convertMarkdownToRichText(testMermaidCode)
      console.log('🧪 [Mermaid测试] HTML转换结果:', htmlContent)
      
      // 检查是否包含Mermaid查看器
      const hasMermaidViewer = htmlContent.includes('mermaid-viewer-container')
      console.log('🧪 [Mermaid测试] 包含Mermaid查看器:', hasMermaidViewer)
      
      if (hasMermaidViewer) {
        console.log('✅ [Mermaid测试] Mermaid渲染功能测试通过')
      } else {
        console.log('❌ [Mermaid测试] Mermaid渲染功能测试失败')
      }
    }
  } else {
    console.log('⚠️ [Mermaid测试] AI响应Mixin未找到，跳过测试')
  }
}

/**
 * 创建测试节点来验证渲染效果
 */
function createMermaidTestNode() {
  console.log('🧪 [Mermaid测试] 创建测试节点')
  
  // 创建测试容器
  const testContainer = document.createElement('div')
  testContainer.id = 'mermaid-test-container'
  testContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    max-height: 600px;
    background: white;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    overflow: auto;
    padding: 16px;
  `
  
  // 添加标题
  const title = document.createElement('h3')
  title.textContent = '🧪 Mermaid渲染测试'
  title.style.cssText = 'margin: 0 0 16px 0; color: #1f2937;'
  testContainer.appendChild(title)
  
  // 模拟富文本内容渲染
  if (window.Vue && window.Vue.prototype.$aiResponseMixin) {
    try {
      const mixin = window.Vue.prototype.$aiResponseMixin
      const htmlContent = mixin.convertMarkdownToRichText(testMermaidCode)
      
      const contentDiv = document.createElement('div')
      contentDiv.innerHTML = htmlContent
      testContainer.appendChild(contentDiv)
      
      // 添加关闭按钮
      const closeBtn = document.createElement('button')
      closeBtn.textContent = '关闭测试'
      closeBtn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: #ef4444;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        cursor: pointer;
        font-size: 12px;
      `
      closeBtn.onclick = () => testContainer.remove()
      testContainer.appendChild(closeBtn)
      
      document.body.appendChild(testContainer)
      
      console.log('✅ [Mermaid测试] 测试节点创建成功')
    } catch (error) {
      console.error('❌ [Mermaid测试] 测试节点创建失败:', error)
    }
  }
}

// 导出测试函数
if (typeof window !== 'undefined') {
  window.testMermaidRendering = testMermaidRendering
  window.createMermaidTestNode = createMermaidTestNode
  
  // 在开发环境下自动运行测试
  if (process.env.NODE_ENV === 'development') {
    // 等待页面加载完成后运行测试
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(testMermaidRendering, 1000)
      })
    } else {
      setTimeout(testMermaidRendering, 1000)
    }
    
    console.log('🧪 [Mermaid测试] 测试工具已加载')
    console.log('🧪 [Mermaid测试] 可以调用 testMermaidRendering() 或 createMermaidTestNode() 进行测试')
  }
}

export { testMermaidRendering, createMermaidTestNode }
