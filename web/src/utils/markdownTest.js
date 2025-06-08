/**
 * Markdown测试工具
 * 用于测试AI回答节点的markdown渲染功能
 */

// 测试用的markdown内容
export const testMarkdownContent = {
  // 基础格式测试
  basic: `# 这是一级标题
## 这是二级标题
### 这是三级标题

**这是粗体文本**
*这是斜体文本*
~~这是删除线文本~~

这是一个包含[链接](https://www.example.com)的段落。

> 这是一个引用块
> 可以包含多行内容`,

  // 列表测试  
  lists: `## 列表示例

### 无序列表
- 第一个项目
- 第二个项目
  - 嵌套项目1
  - 嵌套项目2
- 第三个项目

### 有序列表
1. 第一步
2. 第二步
3. 第三步`,

  // 代码测试
  code: `## 代码示例

这是\`行内代码\`的例子。

\`\`\`javascript
function sayHello(name) {
  console.log('Hello, ' + name + '!');
}

sayHello('World');
\`\`\`

\`\`\`python
def hello_world():
    print("Hello, World!")
    return True
\`\`\``,

  // 复合内容测试
  complex: `# AI回答示例

## 什么是Vue.js？

**Vue.js** 是一个用于构建用户界面的*渐进式*JavaScript框架。

### 主要特点

1. **响应式数据绑定**
   - 数据变化自动更新视图
   - 双向数据绑定

2. **组件化开发**
   - 可复用的组件
   - 清晰的组件通信

3. **易学易用**
   - 简洁的API设计
   - 详细的文档

### 核心概念

\`\`\`javascript
// Vue组件示例
export default {
  data() {
    return {
      message: 'Hello Vue!'
    }
  },
  methods: {
    updateMessage() {
      this.message = 'Updated!'
    }
  }
}
\`\`\`

> Vue.js 的设计理念是通过尽可能简单的API实现**响应式**的数据绑定和组合的视图组件。

更多信息请访问 [Vue.js官网](https://vuejs.org)`
}

// 测试函数
export const testMarkdownRendering = () => {
  console.log('🧪 [Markdown测试] 开始测试markdown渲染功能')
  
  // 检查marked库是否可用
  try {
    // 兼容v4.3.0的导入方式
    const marked = require('marked')
    console.log('✅ [Markdown测试] marked库加载成功')
    
    // 测试基础渲染
    const basicHtml = marked(testMarkdownContent.basic)
    console.log('✅ [Markdown测试] 基础markdown渲染成功')
    console.log('📝 [Markdown测试] 渲染结果预览:', basicHtml.substring(0, 100) + '...')
    
    return true
  } catch (error) {
    console.error('❌ [Markdown测试] marked库加载失败:', error)
    return false
  }
}

// 为window对象添加测试函数
if (typeof window !== 'undefined') {
  window.markdownTest = {
    testMarkdownContent,
    testMarkdownRendering,
    
    // 手动测试AI回答的markdown功能
    testAIMarkdown: (text = testMarkdownContent.complex) => {
      console.log('🤖 [AI Markdown测试] 开始测试AI回答markdown功能')
      
      if (window.testAIResponse) {
        window.testAIResponse(text)
        console.log('✅ [AI Markdown测试] 已触发AI回答生成，请观察节点是否正确显示markdown格式')
      } else {
        console.warn('⚠️ [AI Markdown测试] window.testAIResponse 函数不可用')
      }
    },
    
    // 批量测试不同类型的markdown内容
    testAllMarkdownTypes: () => {
      console.log('🔄 [批量测试] 开始测试所有markdown类型')
      
      Object.keys(testMarkdownContent).forEach((key, index) => {
        setTimeout(() => {
          console.log(`🧪 [批量测试] 正在测试: ${key}`)
          
          // 创建包含markdown的问题
          const question = `请解释以下内容：\n\n${testMarkdownContent[key]}`
          
          if (window.testAIResponse) {
            window.testAIResponse(question)
          }
        }, index * 3000) // 每3秒测试一个
      })
    }
  }
  
  console.log('🎉 [Markdown测试] 测试工具已加载到 window.markdownTest')
  console.log('💡 [使用提示] 可以使用以下命令测试:')
  console.log('   window.markdownTest.testMarkdownRendering() - 测试基础渲染')
  console.log('   window.markdownTest.testAIMarkdown() - 测试AI回答markdown')
  console.log('   window.markdownTest.testAllMarkdownTypes() - 批量测试所有类型')
} 