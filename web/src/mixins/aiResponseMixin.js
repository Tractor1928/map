import { aiServiceFactory } from '@/services/ai'
import { createUid } from 'simple-mind-map/src/utils'
import { AI_PROMPTS, buildContextPrompt } from '@/config/aiPrompts'
// 修复marked导入方式
const marked = require('marked')
// 动态导入Mermaid库以避免构建问题
let mermaid = null
const verboseAIDebug =
  typeof window !== 'undefined' && window.__AI_VERBOSE_LOG__ === true

/**
 * AI响应处理Mixin
 * 提供节点自动生成AI回答的功能
 */
export default {
  data() {
    return {
      // 存储AI回答节点的映射关系 (原始节点ID -> AI回答节点ID)
      aiResponseNodes: new Map(),
      // 正在处理的AI请求集合
      pendingAIRequests: new Set(),
      // AI功能是否启用
      aiResponseEnabled: true,
      // Mermaid初始化状态
      mermaidInitialized: false
    }
  },

  // 组件创建时初始化全局函数
  created() {
    this.initGlobalMermaidRenderer()
  },

  methods: {
    /**
     * 初始化全局Mermaid渲染器
     */
    initGlobalMermaidRenderer() {
      // 加载Mermaid CDN
      this.loadMermaidCDN()
      
      // 创建全局渲染函数
      if (!window.renderMermaidChart) {
        window.renderMermaidChart = async (chartId, code) => {
          console.log('🌍 [全局Mermaid] 开始渲染图表:', chartId)
          
          try {
            const container = document.getElementById(chartId)
            if (!container) {
              console.warn('🌍 [全局Mermaid] 容器未找到:', chartId)
              return
            }

            console.log('🌍 [全局Mermaid] 找到容器，尝试渲染图表')

            // 等待Mermaid库加载
            if (!window.mermaid) {
              console.log('🌍 [全局Mermaid] 等待Mermaid库加载...')
              await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                  if (window.mermaid) {
                    clearInterval(checkInterval)
                    resolve()
                  }
                }, 100)
                
                // 超时后显示代码
                setTimeout(() => {
                  clearInterval(checkInterval)
                  resolve()
                }, 3000)
              })
            }

            // 如果Mermaid库加载成功，渲染图表
            if (window.mermaid) {
              console.log('🌍 [全局Mermaid] Mermaid库已加载，开始渲染图表')
              
              try {
                // 初始化Mermaid
                if (!window.mermaidInitialized) {
                  window.mermaid.initialize({
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
                    }
                  })
                  window.mermaidInitialized = true
                }

                // 渲染图表
                const { svg } = await window.mermaid.render(`${chartId}-svg`, code.trim())
                
                container.innerHTML = `
                  <div style="padding: 20px; text-align: center; background: white;">
                    ${svg}
                  </div>
                `
                
                console.log('✅ [全局Mermaid] 图表渲染成功:', chartId)
                return
              } catch (renderError) {
                console.warn('🌍 [全局Mermaid] 图表渲染失败，显示代码:', renderError)
              }
            }

            // 如果无法渲染图表，显示代码
            console.log('🌍 [全局Mermaid] 显示Mermaid代码')
            container.innerHTML = `
              <div style="padding: 20px; text-align: left; background: white;">
                <div style="color: #059669; font-weight: 600; margin-bottom: 16px; font-size: 14px; border-bottom: 2px solid #d1fae5; padding-bottom: 8px;">
                  📊 Mermaid流程图代码
                </div>
                <div style="background: #1f2937; border: 2px solid #374151; border-radius: 6px; padding: 16px; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; color: #10b981; overflow-x: auto;">${code.trim()}</div>
                <div style="margin-top: 12px; padding: 10px; background: #ecfdf5; border-left: 3px solid #10b981; border-radius: 4px; font-size: 12px; color: #047857;">
                  💡 <strong>提示：</strong>此代码可以在支持Mermaid的环境中渲染为流程图（如Typora、Obsidian、GitHub、Notion等）
                </div>
              </div>
            `

            console.log('✅ [全局Mermaid] 代码显示成功:', chartId)

          } catch (error) {
            console.error('❌ [全局Mermaid] 处理失败:', error)
            
            const container = document.getElementById(chartId)
            if (container) {
              container.innerHTML = `
                <div style="padding: 16px; color: #dc2626; text-align: center;">
                  <div>⚠️ 无法显示图表</div>
                  <div style="font-size: 11px; margin-top: 4px;">错误: ${error.message || '未知错误'}</div>
                </div>
              `
            }
          }
        }
      }
    },

    /**
     * 动态加载Mermaid CDN
     */
    loadMermaidCDN() {
      if (window.mermaid || document.querySelector('script[data-mermaid-cdn]')) {
        return
      }

      console.log('📦 [Mermaid] 开始加载Mermaid CDN')
      
      const script = document.createElement('script')
      script.setAttribute('data-mermaid-cdn', 'true')
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
      script.onload = () => {
        console.log('✅ [Mermaid] Mermaid CDN加载成功')
      }
      script.onerror = () => {
        console.warn('⚠️ [Mermaid] Mermaid CDN加载失败，将显示代码')
      }
      
      document.head.appendChild(script)
    },

    /**
     * 判断文本是否需要生成AI回答
     * @param {string} text - 节点文本内容
     * @returns {boolean} 是否需要AI回答
     */
    shouldGenerateAIResponse(text) {
      console.log('🧠 [AI判断] 开始分析文本:', text)
      
      if (!text || typeof text !== 'string' || text.length < 3) {
        console.log('🧠 [AI判断] 文本无效:', { text, type: typeof text, length: text?.length })
        return false
      }
      
      // 如果AI功能被禁用，直接返回false
      if (!this.aiResponseEnabled) {
        console.log('🧠 [AI判断] AI功能已禁用')
        return false
      }
      
      // 移除多余的空白字符
      const trimmedText = text.trim()
      console.log('🧠 [AI判断] 处理后文本:', trimmedText)
      
      // 问题关键词判断
      const questionIndicators = [
        '?', '？', // 问号
        '怎么', '如何', '怎样', '怎么样', // 方式方法
        '为什么', '为啥', '什么原因', // 原因
        '什么', '哪个', '哪些', '哪里', // 疑问词
        '是否', '能否', '可以', '可不可以', // 是否类
        '介绍', '解释', '说明', '阐述', // 解释类
        '对比', '区别', '不同', '差异', // 对比类
      ]
      
      const matchedIndicators = questionIndicators.filter(indicator => 
        trimmedText.includes(indicator)
      )
      const hasQuestionIndicator = matchedIndicators.length > 0
      console.log('🧠 [AI判断] 问题关键词检查:', { 
        matched: matchedIndicators,
        hasQuestionIndicator 
      })
      
      // 句子结构判断（较长的陈述句也可能需要AI回答）
      const isLongStatement = trimmedText.length > 15 && !trimmedText.includes('：') && !trimmedText.includes(':')
      console.log('🧠 [AI判断] 长句判断:', { 
        length: trimmedText.length,
        hasColon: trimmedText.includes('：') || trimmedText.includes(':'),
        isLongStatement 
      })
      
      // 专业术语判断（包含专业词汇的短句）
      const technicalTerms = ['AI', '算法', '编程', '技术', '架构', '框架', '设计模式', '数据结构']
      const matchedTerms = technicalTerms.filter(term => trimmedText.includes(term))
      const hasTechnicalTerm = matchedTerms.length > 0 && trimmedText.length > 8
      console.log('🧠 [AI判断] 专业术语检查:', { 
        matched: matchedTerms,
        hasTechnicalTerm 
      })
      
      const result = hasQuestionIndicator || isLongStatement || hasTechnicalTerm
      console.log('🧠 [AI判断] 最终结果:', {
        hasQuestionIndicator,
        isLongStatement,
        hasTechnicalTerm,
        finalResult: result
      })
      
      return result
    },

    /**
     * 为指定节点生成AI回答
     * @param {Object} node - 思维导图节点实例
     * @param {string} question - 问题文本
     */
    async generateAIResponse(node, question) {
      console.log('🚀 [AI生成] 开始生成AI回答')
      console.log('🚀 [AI生成] 参数检查:', { node, question })
      
      if (!node || !question) {
        console.warn('🚀 [AI生成] 缺少必要参数')
        return
      }
      
      const nodeId = node.getData('uid') || node.uid
      console.log('🚀 [AI生成] 节点ID:', nodeId)
      
      if (!nodeId) {
        console.warn('🚀 [AI生成] 无法获取节点ID')
        return
      }
      
      // 避免重复请求
      if (this.pendingAIRequests.has(nodeId)) {
        console.log(`🚀 [AI生成] 节点 ${nodeId} 已有正在处理的AI请求`)
        return
      }
      
      // 避免为AI回答节点再次生成回答
      if (node.getData('isAIResponse')) {
        console.log('🚀 [AI生成] 跳过为AI回答节点生成回答')
        return
      }

      this.pendingAIRequests.add(nodeId)
      console.log('🚀 [AI生成] 已添加到待处理请求列表')

      try {
        console.log(`🚀 [AI生成] 开始为节点 ${nodeId} 生成AI回答，问题: ${question}`)
        
        // 创建AI回答节点
        console.log('🚀 [AI生成] 正在创建AI回答节点...')
        console.log('🚀 [AI生成] 父节点详细信息:', {
          text: node.getData('text'),
          uid: node.getData('uid') || node.uid,
          isQuestion: node.getData('isQuestion'),
          isAIResponse: node.getData('isAIResponse'),
          nodeType: node.constructor.name
        })
        const aiNode = await this.createAIResponseNode(node, '🤖 正在思考中...')
        if (!aiNode) {
          throw new Error('创建AI回答节点失败')
        }
        console.log('🚀 [AI生成] AI回答节点创建成功')
        console.log('🚀 [AI生成] AI回答节点的父节点:', {
          text: aiNode.parent?.getData('text'),
          uid: aiNode.parent?.getData('uid') || aiNode.parent?.uid,
          isQuestion: aiNode.parent?.getData('isQuestion')
        })
        
        const aiNodeId = aiNode.getData('uid') || aiNode.uid
        console.log('🚀 [AI生成] AI节点ID:', aiNodeId)
        
        // 存储映射关系
        this.aiResponseNodes.set(nodeId, aiNodeId)
        console.log('🚀 [AI生成] 节点映射关系已存储')

        // 调用AI服务
        console.log('🚀 [AI生成] 正在获取AI服务...')
        const aiService = aiServiceFactory.getService()
        console.log('🚀 [AI生成] AI服务获取成功:', aiService)
        
        // 构建上下文提示词
        const contextPrompt = buildContextPrompt(node, node.parent)
        const hasContext = Boolean(contextPrompt)
        console.log('🚀 [AI生成] 是否有上下文:', hasContext)
        console.log('🚀 [AI生成] 上下文提示词:', contextPrompt)
        
        // 获取当前选中的提示词配置（动态获取，支持用户切换）
        const systemPrompt = AI_PROMPTS.getSystemPrompt(hasContext)
        const promptEnabled = Boolean(systemPrompt && systemPrompt.trim())
        console.log('🚀 [AI生成] 使用的提示词配置长度:', systemPrompt.length)
        console.log('🚀 [AI生成] 是否启用提示词:', promptEnabled)
        
        const messages = []
        if (promptEnabled) {
          messages.push({
            role: 'system',
            content: systemPrompt
          })
        }
        
        // 上下文始终按导图链路注入（即使空白提示词模式）
        if (contextPrompt) {
          messages.push({
            role: 'system',
            content: contextPrompt
          })
          console.log('🚀 [AI生成] 已添加上下文信息')
        }
        
        // 添加用户问题
        messages.push({
          role: 'user',
          content: question
        })
        
        console.log('🚀 [AI生成] 准备发送消息:', messages)

        let currentResponse = ''
        console.log('🚀 [AI生成] 开始调用AI服务生成回答...')
        const fullResponse = await aiService.generateResponse(
          messages,
          // 进度回调 - 流式更新内容
          (content) => {
            if (verboseAIDebug) {
              console.log('🚀 [AI生成] 流式更新:', content)
            }
            currentResponse += content
            this.updateAIResponseContent(aiNodeId, currentResponse, false)
          },
          // 思考过程回调（可选）
          (reasoning) => {
            console.log('🚀 [AI生成] AI思考过程:', reasoning)
          }
        )
        console.log('🚀 [AI生成] AI服务调用完成，完整回答:', fullResponse)

        // 最终更新并标记完成
        const finalContent = fullResponse || currentResponse || '回答生成完成'
        this.updateAIResponseContent(aiNodeId, finalContent, true)
        
        console.log(`🚀 [AI生成] 节点 ${nodeId} 的AI回答生成完成`)
        
      } catch (error) {
        console.error('🚀 [AI生成] AI回答生成失败:', error)
        const aiNodeId = this.aiResponseNodes.get(nodeId)
        if (aiNodeId) {
          this.handleAIResponseError(aiNodeId, error)
        }
      } finally {
        this.pendingAIRequests.delete(nodeId)
        console.log('🚀 [AI生成] 已从待处理请求列表中移除')
      }
    },

    /**
     * 创建AI回答节点
     * @param {Object} parentNode - 父节点
     * @param {string} initialText - 初始文本
     * @returns {Promise<Object|null>} 创建的AI回答节点
     */
    async createAIResponseNode(parentNode, initialText = '🤖 正在思考中...') {
      console.log('🏗️ [节点创建] 开始创建AI回答节点')
      console.log('🏗️ [节点创建] 父节点:', parentNode)
      console.log('🏗️ [节点创建] 初始文本:', initialText)
      
      try {
        if (!this.mindMap) {
          console.error('🏗️ [节点创建] mindMap实例不存在')
          return null
        }
        console.log('🏗️ [节点创建] mindMap实例存在:', this.mindMap)

        // 生成唯一ID（使用simple-mind-map的工具函数或自定义）
        const uid = this.generateNodeId()
        console.log('🏗️ [节点创建] 生成的节点ID:', uid)

        // 使用思维导图API创建子节点
        console.log('🏗️ [节点创建] 正在执行INSERT_CHILD_NODE命令...')
        // INSERT_CHILD_NODE参数：openEdit, appointNodes, appointData, appointChildren
        // openEdit: 是否打开编辑模式
        // appointNodes: 指定节点数组（为哪些节点添加子节点）
        // appointData: 新节点的数据
        // appointChildren: 子节点的子节点数组
        this.mindMap.execCommand('INSERT_CHILD_NODE', false, [parentNode], {
          text: initialText,
          isAIResponse: true,
          aiStatus: 'loading'
          // 不强制指定uid，让系统自动生成
        }, [])
        console.log('🏗️ [节点创建] INSERT_CHILD_NODE命令执行完成')
        
        // 获取创建的节点实例 - 直接查找最新AI子节点
        console.log('🏗️ [节点创建] 正在查找创建的节点...')
        const aiNode = await this.findLatestAIChildNode(parentNode)
        console.log('🏗️ [节点创建] 查找结果:', aiNode)
        
        if (aiNode) {
          const actualUid = aiNode.getData('uid') || aiNode.uid
          console.log(`🏗️ [节点创建] ✅ AI回答节点创建成功，实际ID: ${actualUid}`)
          // 更新UID映射
          return aiNode
        } else {
          console.warn(`🏗️ [节点创建] ⚠️ 未找到创建的AI节点`)
        }
        
        return aiNode
      } catch (error) {
        console.error('🏗️ [节点创建] ❌ 创建AI回答节点失败:', error)
        return null
      }
    },

    /**
     * 更新AI回答节点内容
     * @param {string} nodeId - 节点ID
     * @param {string} content - 新内容
     * @param {boolean} isComplete - 是否完成
     */
    updateAIResponseContent(nodeId, content, isComplete = false) {
      try {
        const node = this.findNodeByUid(nodeId)
        if (!node) {
          console.warn(`找不到AI回答节点: ${nodeId}`)
          return
        }

        // 检查是否包含markdown格式
        const hasMarkdown = this.detectMarkdownFormat(content)
        if (verboseAIDebug) {
          console.log('🎨 [Markdown渲染] 检测到markdown格式:', hasMarkdown)
        }

        let formattedContent
        if (hasMarkdown && isComplete) {
          // 完成状态且包含markdown时，转换为富文本HTML
          try {
            const htmlContent = this.convertMarkdownToRichText(content)
            formattedContent = htmlContent
            console.log('🎨 [Markdown渲染] 转换为富文本:', htmlContent)
            
            // 设置为富文本节点
            this.mindMap.execCommand('SET_NODE_DATA', node, {
              richText: true,
              aiStatus: 'complete'
            })
            
            // 更新节点文本（富文本格式）
            this.mindMap.execCommand('SET_NODE_TEXT', node, formattedContent, true)
          } catch (error) {
            console.error('🎨 [Markdown渲染] 转换失败，使用原文本:', error)
            formattedContent = content
            this.mindMap.execCommand('SET_NODE_TEXT', node, formattedContent)
            this.mindMap.execCommand('SET_NODE_DATA', node, {
              aiStatus: 'complete'
            })
          }
        } else {
          // 加载状态或纯文本内容
          formattedContent = isComplete ? content : `🤖 ${content}`
          this.mindMap.execCommand('SET_NODE_TEXT', node, formattedContent)
          
          const status = isComplete ? 'complete' : 'loading'
          this.mindMap.execCommand('SET_NODE_DATA', node, {
            aiStatus: status
          })
        }

        // 如果完成，更新样式
        if (isComplete) {
          this.$nextTick(() => {
            this.applyAINodeCompleteStyle(node)
          })
        }
      } catch (error) {
        console.error('更新AI回答节点内容失败:', error)
      }
    },

    /**
     * 增强的markdown格式检测
     * @param {string} text - 文本内容
     * @returns {boolean} 是否包含markdown格式
     */
    detectMarkdownFormat(text) {
      if (!text || typeof text !== 'string') return false
      
      // 检测常见的markdown元素（增强版）
      const markdownPatterns = [
        /^#{1,6}\s+.+$/m,                    // 标题 # ## ### 等
        /\*\*[^*\n]+\*\*/,                  // 粗体 **text**
        /\*[^*\n]+\*/,                      // 斜体 *text*
        /\[([^\]]+)\]\(([^)]+)\)/,          // 链接 [text](url)
        /^\s*[-*+]\s+.+$/m,                 // 无序列表 - * +
        /^\s*\d+\.\s+.+$/m,                 // 有序列表 1. 2.
        /```[\w]*\n?[\s\S]*?```/,           // 代码块 ```code``` 或 ```lang\ncode```
        /`[^`\n]+`/,                        // 行内代码 `code`
        /^>\s+.+$/m,                        // 引用 > text
        /^\|.+\|.+\|$/m,                    // 表格 |col1|col2|col3|
        /^[-=]{3,}$/m,                      // 分割线 --- 或 ===
        /!\[([^\]]*)\]\(([^)]+)\)/,         // 图片 ![alt](url)
        /~~[^~\n]+~~/,                      // 删除线 ~~text~~
      ]
      
      // 检测AI生成内容的特征模式
      const aiContentPatterns = [
        /^🚀\s*\[AI生成\]/,                 // AI生成标识
        /^在深入探讨.*之前/,                 // AI典型开头
        /^让我们.*明确.*知识点/,            // AI典型表述
        /^现在.*我将为你.*梳理/,            // AI典型表述
        /^以下是.*详细.*解读/,              // AI典型表述
        /^希望.*能帮助你理解/,              // AI典型结尾
        /结构层级树|技术演进|演进路线/,       // AI常用术语
        /mermaid\s*graph/i,                 // Mermaid图表
      ]
      
      // 检测复杂嵌套列表结构
      const nestedListPattern = /^\s{2,}[-*+]\s+.+$/m
      const multiLevelHeadings = (text.match(/^#{1,6}\s/gm) || []).length >= 2
      
      // 综合判断
      const hasBasicMarkdown = markdownPatterns.some(pattern => pattern.test(text))
      const hasAIContent = aiContentPatterns.some(pattern => pattern.test(text))
      const hasNestedStructure = nestedListPattern.test(text) || multiLevelHeadings
      
      // 如果包含AI内容特征或复杂结构，即使基础markdown检测失败也认为是markdown
      return hasBasicMarkdown || hasAIContent || hasNestedStructure
    },

    /**
     * 将markdown内容转换为富文本HTML格式
     * @param {string} markdown - markdown内容
     * @returns {string} 富文本HTML
     */
    convertMarkdownToRichText(markdown) {
      if (!markdown) return ''
      
      try {
        // 确保marked可用并正确调用
        let html = ''
        
        // 根据marked版本使用不同的调用方式
        if (typeof marked === 'function') {
          // 直接调用marked函数
          html = marked(markdown)
        } else if (marked.marked && typeof marked.marked === 'function') {
          // 使用marked.marked方法
          html = marked.marked(markdown)
        } else if (marked.parse && typeof marked.parse === 'function') {
          // 使用marked.parse方法
          html = marked.parse(markdown)
        } else {
          console.warn('🎨 [Markdown渲染] marked库调用方式不明确，使用降级方案')
          // 使用简单的降级方案
          html = this.simpleMarkdownToHtml(markdown)
        }
        
        console.log('🎨 [Markdown渲染] 原始HTML输出:', html.substring(0, 200) + '...')
        
        // 将HTML转换为适合思维导图富文本的格式
        html = this.formatRichTextForMindMap(html)
        
        return html
      } catch (error) {
        console.error('🎨 [Markdown渲染] marked转换失败:', error)
        console.error('🎨 [Markdown渲染] marked对象:', marked)
        console.error('🎨 [Markdown渲染] marked类型:', typeof marked)
        
        console.log('🎨 [Markdown渲染] 使用降级方案渲染markdown')
        // 如果marked转换失败，使用简单的降级方案
        try {
          const html = this.simpleMarkdownToHtml(markdown)
          return this.formatRichTextForMindMap(html)
        } catch (fallbackError) {
          console.error('🎨 [Markdown渲染] 降级方案也失败:', fallbackError)
          // 最后的降级：基本HTML包装
          return `<p>${markdown.replace(/\n/g, '<br>')}</p>`
        }
      }
    },

    /**
     * 格式化富文本HTML以适应思维导图显示
     * @param {string} html - HTML内容
     * @returns {string} 格式化后的HTML
     */
    formatRichTextForMindMap(html) {
      // 创建临时DOM元素进行HTML操作
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      
      // 将h1-h6标题转换为带样式的p标签
      const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6')
      headings.forEach(heading => {
        const level = parseInt(heading.tagName[1])
        const p = document.createElement('p')
        const span = document.createElement('span')
        
        // 根据标题级别设置更明显的样式差异和层级标识
        let fontSize, fontWeight, color, marginTop, marginBottom, prefix, backgroundColor, borderLeft
        
        switch(level) {
          case 1:
            fontSize = '22px'
            fontWeight = 'bold'
            color = '#1a365d'
            marginTop = '20px'
            marginBottom = '12px'
            prefix = '📋 '
            backgroundColor = 'rgba(59, 130, 246, 0.08)'
            borderLeft = '4px solid #3b82f6'
            break
          case 2:
            fontSize = '19px'
            fontWeight = 'bold'
            color = '#2d3748'
            marginTop = '16px'
            marginBottom = '8px'
            prefix = '📌 '
            backgroundColor = 'rgba(16, 185, 129, 0.08)'
            borderLeft = '3px solid #10b981'
            break
          case 3:
            fontSize = '17px'
            fontWeight = 'bold'
            color = '#4a5568'
            marginTop = '14px'
            marginBottom = '6px'
            prefix = '🔸 '
            backgroundColor = 'rgba(245, 158, 11, 0.08)'
            borderLeft = '3px solid #f59e0b'
            break
          case 4:
            fontSize = '15px'
            fontWeight = '600'
            color = '#718096'
            marginTop = '12px'
            marginBottom = '4px'
            prefix = '▪️ '
            backgroundColor = 'rgba(139, 92, 246, 0.06)'
            borderLeft = '2px solid #8b5cf6'
            break
          case 5:
            fontSize = '14px'
            fontWeight = '600'
            color = '#a0aec0'
            marginTop = '10px'
            marginBottom = '3px'
            prefix = '• '
            backgroundColor = 'rgba(236, 72, 153, 0.06)'
            borderLeft = '2px solid #ec4899'
            break
          default: // h6
            fontSize = '13px'
            fontWeight = '500'
            color = '#cbd5e0'
            marginTop = '8px'
            marginBottom = '2px'
            prefix = '◦ '
            backgroundColor = 'rgba(107, 114, 128, 0.05)'
            borderLeft = '1px solid #6b7280'
        }
        
        span.style.fontSize = fontSize
        span.style.fontWeight = fontWeight
        span.style.color = color
        span.style.display = 'block'
        span.style.marginTop = marginTop
        span.style.marginBottom = marginBottom
        span.style.paddingLeft = '12px'
        span.style.paddingTop = '8px'
        span.style.paddingBottom = '8px'
        span.style.backgroundColor = backgroundColor
        span.style.borderLeft = borderLeft
        span.style.borderRadius = '4px'
        span.innerHTML = prefix + heading.innerHTML
        
        p.appendChild(span)
        heading.parentNode.replaceChild(p, heading)
      })
      
      // 处理引用块
      const blockquotes = tempDiv.querySelectorAll('blockquote')
      blockquotes.forEach(blockquote => {
        const p = document.createElement('p')
        const span = document.createElement('span')
        
        span.style.borderLeft = '4px solid rgba(66, 153, 225, 0.6)'
        span.style.paddingLeft = '12px'
        span.style.paddingTop = '8px'
        span.style.paddingBottom = '8px'
        span.style.margin = '8px 0'
        span.style.fontStyle = 'italic'
        span.style.color = '#4a5568'
        span.style.backgroundColor = 'rgba(237, 242, 247, 0.3)'
        span.style.display = 'block'
        span.innerHTML = blockquote.innerHTML
        
        p.appendChild(span)
        blockquote.parentNode.replaceChild(p, blockquote)
      })
      
      // 处理强调文本
      const strongElements = tempDiv.querySelectorAll('strong')
      strongElements.forEach(strong => {
        strong.style.fontWeight = 'bold'
        strong.style.color = '#2d3748'
      })
      
      const emElements = tempDiv.querySelectorAll('em')
      emElements.forEach(em => {
        em.style.fontStyle = 'italic'
        em.style.color = '#4a5568'
      })
      
      // 处理列表，增强嵌套列表的视觉层次
      const lists = tempDiv.querySelectorAll('ul, ol')
      lists.forEach((list, listIndex) => {
        // 计算嵌套层级
        let nestLevel = 0
        let parent = list.parentElement
        while (parent && parent !== tempDiv) {
          if (parent.tagName === 'LI') {
            nestLevel++
          }
          parent = parent.parentElement
        }
        
        // 设置列表样式
        list.style.marginTop = nestLevel === 0 ? '8px' : '4px'
        list.style.marginBottom = nestLevel === 0 ? '8px' : '4px'
        list.style.paddingLeft = `${20 + nestLevel * 16}px`
        list.style.listStyleType = list.tagName === 'UL' ? 
          (nestLevel % 2 === 0 ? 'disc' : 'circle') : 'decimal'
      })
      
      // 处理列表项，确保每个li都包装在p标签中并添加适当的样式
      const listItems = tempDiv.querySelectorAll('li')
      listItems.forEach((li, index) => {
        // 计算嵌套层级
        let nestLevel = 0
        let parent = li.parentElement
        while (parent && parent !== tempDiv) {
          if (parent.tagName === 'UL' || parent.tagName === 'OL') {
            let grandParent = parent.parentElement
            if (grandParent && grandParent.tagName === 'LI') {
              nestLevel++
            }
          }
          parent = parent.parentElement
        }
        
        if (!li.querySelector('p')) {
          const p = document.createElement('p')
          const span = document.createElement('span')
          
          // 根据嵌套层级设置不同的样式
          span.style.marginBottom = '6px'
          span.style.lineHeight = '1.5'
          span.style.display = 'block'
          
          // 为不同层级设置不同的颜色和缩进
          switch(nestLevel) {
            case 0:
              span.style.color = '#2d3748'
              span.style.fontWeight = '500'
              break
            case 1:
              span.style.color = '#4a5568'
              span.style.fontWeight = '400'
              span.style.fontSize = '14px'
              break
            case 2:
              span.style.color = '#718096'
              span.style.fontWeight = '400'
              span.style.fontSize = '13px'
              break
            default:
              span.style.color = '#a0aec0'
              span.style.fontWeight = '300'
              span.style.fontSize = '12px'
          }
          
          span.innerHTML = li.innerHTML
          p.appendChild(span)
          li.innerHTML = ''
          li.appendChild(p)
        }
        
        // 为列表项添加间距
        li.style.marginBottom = '4px'
        li.style.position = 'relative'
      })
      
      // 处理代码块，包括特殊类型识别
      const codeBlocks = tempDiv.querySelectorAll('pre code')
      codeBlocks.forEach(code => {
        const pre = code.parentElement
        const p = document.createElement('p')
        const span = document.createElement('span')
        
        // 获取代码内容和语言类型
        const codeContent = code.textContent || code.innerText
        const className = code.className || ''
        const language = className.match(/language-(\w+)/)?.[1] || ''
        
        // 根据代码类型设置不同的样式和标识
        let backgroundColor, borderColor, prefix, headerColor
        
        switch(language.toLowerCase()) {
          case 'mermaid':
            backgroundColor = 'rgba(16, 185, 129, 0.08)'
            borderColor = '#10b981'
            prefix = '📊 Mermaid图表'
            headerColor = '#059669'
            break
          case 'javascript':
          case 'js':
            backgroundColor = 'rgba(245, 158, 11, 0.08)'
            borderColor = '#f59e0b'
            prefix = '🟨 JavaScript'
            headerColor = '#d97706'
            break
          case 'python':
          case 'py':
            backgroundColor = 'rgba(59, 130, 246, 0.08)'
            borderColor = '#3b82f6'
            prefix = '🐍 Python'
            headerColor = '#2563eb'
            break
          case 'sql':
            backgroundColor = 'rgba(139, 92, 246, 0.08)'
            borderColor = '#8b5cf6'
            prefix = '🗄️ SQL'
            headerColor = '#7c3aed'
            break
          case 'json':
            backgroundColor = 'rgba(34, 197, 94, 0.08)'
            borderColor = '#22c55e'
            prefix = '📄 JSON'
            headerColor = '#16a34a'
            break
          default:
            backgroundColor = 'rgba(107, 114, 128, 0.08)'
            borderColor = '#6b7280'
            prefix = language ? `💻 ${language.toUpperCase()}` : '💻 代码'
            headerColor = '#4b5563'
        }
        
        // 创建代码块容器
        const container = document.createElement('div')
        container.style.backgroundColor = backgroundColor
        container.style.border = `2px solid ${borderColor}`
        container.style.borderRadius = '8px'
        container.style.marginTop = '12px'
        container.style.marginBottom = '12px'
        container.style.overflow = 'hidden'
        
        // 创建代码头部
        if (prefix) {
          const header = document.createElement('div')
          header.style.backgroundColor = borderColor
          header.style.color = 'white'
          header.style.padding = '6px 12px'
          header.style.fontSize = '12px'
          header.style.fontWeight = 'bold'
          header.textContent = prefix
          container.appendChild(header)
        }
        
        // 设置代码内容样式
        span.style.fontFamily = '"Fira Code", "Consolas", "Monaco", monospace'
        span.style.backgroundColor = 'transparent'
        span.style.padding = '12px'
        span.style.fontSize = '13px'
        span.style.display = 'block'
        span.style.whiteSpace = 'pre-wrap'
        span.style.wordBreak = 'break-word'
        span.style.lineHeight = '1.5'
        span.style.color = '#1f2937'
        span.style.overflowX = 'auto'
        
        // 特殊处理mermaid图表
        if (language.toLowerCase() === 'mermaid') {
          // 直接创建图表容器，不要任何标题层
          const chartContainer = document.createElement('div')
          chartContainer.className = 'mermaid-chart-container'
          
          // 生成唯一ID
          const chartId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          chartContainer.id = chartId
          
          // 立即填充加载状态，避免foreignObject高度计算问题
          chartContainer.innerHTML = `
            <div style="padding: 40px 20px; text-align: center; background: white; min-height: 150px;">
              <div style="color: #10b981; font-size: 16px; margin-bottom: 12px;">
                🔄 正在渲染图表...
              </div>
              <div style="color: #6b7280; font-size: 12px;">
                请稍候
              </div>
            </div>
          `
          
          console.log('✅ [Mermaid] 加载状态已预填充到容器:', chartId)
          
          // 异步触发实际渲染
          setTimeout(() => {
            if (window.renderMermaidChart) {
              window.renderMermaidChart(chartId, codeContent)
            }
          }, 100)
          
          // 添加样式
          this.addMermaidStyles()
          
          // 直接添加图表容器，不要wrapper
          span.appendChild(chartContainer)
          span.style.padding = '0' // 移除默认padding
        } else {
          span.textContent = codeContent
        }
        
        container.appendChild(span)
        p.appendChild(container)
        pre.parentNode.replaceChild(p, pre)
      })
      
      // 处理行内代码
      const inlineCodes = tempDiv.querySelectorAll('code')
      inlineCodes.forEach(code => {
        const span = document.createElement('span')
        span.style.fontFamily = 'monospace'
        span.style.backgroundColor = 'rgba(240, 240, 240, 0.2)'  // 更透明的背景
        span.style.padding = '2px 4px'
        span.style.borderRadius = '3px'
        span.style.fontSize = '13px'
        span.style.border = '1px solid rgba(225, 228, 232, 0.3)'  // 半透明边框
        span.innerHTML = code.innerHTML
        code.parentNode.replaceChild(span, code)
      })
      
      // 处理普通段落，确保换行正确显示
      const paragraphs = tempDiv.querySelectorAll('p')
      paragraphs.forEach(p => {
        // 如果段落直接包含文本节点，确保换行符被转换为<br>
        if (p.childNodes.length > 0) {
          p.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('\n')) {
              const span = document.createElement('span')
              span.innerHTML = node.textContent.replace(/\n/g, '<br>')
              p.replaceChild(span, node)
            }
          })
        }
      })
      
      // 确保所有文本都被p标签包围
      const result = tempDiv.innerHTML
      
      // 如果内容不是以p标签开始，包装在p标签中
      if (!result.trim().startsWith('<p>')) {
        return `<p><span>${result}</span></p>`
      }
      
      return result
    },

    /**
     * 处理AI回答错误
     * @param {string} nodeId - 节点ID
     * @param {Error} error - 错误对象
     */
    handleAIResponseError(nodeId, error) {
      try {
        const node = this.findNodeByUid(nodeId)
        if (!node) {
          console.warn(`找不到AI回答节点: ${nodeId}`)
          return
        }

        const errorMessage = `❌ AI回答生成失败: ${error.message || '未知错误'}`
        
        // 更新节点文本和状态
        this.mindMap.execCommand('SET_NODE_TEXT', node, errorMessage)
        this.mindMap.execCommand('SET_NODE_DATA', node, {
          aiStatus: 'error'
        })

        // 添加错误样式
        this.$nextTick(() => {
          this.applyAINodeErrorStyle(node)
        })
      } catch (err) {
        console.error('处理AI回答错误失败:', err)
      }
    },

    /**
     * 节点文本编辑完成处理函数
     * @param {Object} node - 编辑的节点
     * @param {string} newText - 新文本
     * @param {string} oldText - 旧文本
     */
    handleNodeTextEditEnd(node, newText, oldText) {
      console.log('🔍 [AI调试] 节点文本编辑完成事件触发')
      const hasAIChild = node.children && node.children.some(child => child.getData('isAIResponse'))
      console.log('🔍 [AI调试] 节点信息:', {
        node: node,
        newText: newText,
        oldText: oldText,
        nodeId: node ? (node.getData('uid') || node.uid) : 'unknown',
        isAIResponse: node ? node.getData('isAIResponse') : false,
        hasAIChild: hasAIChild,
        textChanged: newText !== oldText
      })

      // 检查文本是否为空
      if (!newText || newText.trim() === '') {
        console.log('🔍 [AI调试] 跳过：文本为空')
        return
      }
      
      // 不为AI回答节点生成回答
      if (node.getData('isAIResponse')) {
        console.log('🔍 [AI调试] 跳过：当前节点是AI回答节点')
        return
      }
      
      // 判断是否需要生成AI回答
      const shouldGenerate = this.shouldGenerateAIResponse(newText)
      console.log('🔍 [AI调试] 智能判断结果:', {
        text: newText,
        shouldGenerate: shouldGenerate,
        aiEnabled: this.aiResponseEnabled
      })
      
      if (shouldGenerate) {
        console.log('🔍 [AI调试] 准备生成AI回答...')
        // 延迟执行，确保节点编辑完全完成
        this.$nextTick(() => {
          this.generateAIResponse(node, newText)
        })
      } else {
        console.log('🔍 [AI调试] 不满足AI回答生成条件')
      }
    },

    /**
     * 生成节点唯一ID
     * @returns {string} 唯一ID
     */
    generateNodeId() {
      return createUid()
    },

    /**
     * 根据UID查找节点
     * @param {string} uid - 节点UID
     * @returns {Object|null} 节点实例
     */
    findNodeByUid(uid) {
      if (this.mindMap && this.mindMap.renderer && this.mindMap.renderer.findNodeByUid) {
        return this.mindMap.renderer.findNodeByUid(uid)
      }
      // 备用查找方法
      if (this.mindMap && this.mindMap.getAllNodes) {
        const allNodes = this.mindMap.getAllNodes()
        return allNodes.find(node => (node.getData('uid') || node.uid) === uid)
      }
      return null
    },

    /**
     * 重试查找创建的节点
     * @param {string} uid - 节点UID
     * @param {Object} parentNode - 父节点
     * @returns {Promise<Object|null>} 找到的节点
     */
    async findCreatedNodeWithRetry(uid, parentNode) {
      const maxRetries = 10
      const retryDelay = 50 // ms
      
      for (let i = 0; i < maxRetries; i++) {
        console.log(`🔍 [节点查找] 第${i + 1}次尝试查找节点: ${uid}`)
        
        // 方法1: 通过UID查找
        let node = this.findNodeByUid(uid)
        if (node) {
          console.log(`🔍 [节点查找] ✅ 通过UID找到节点`)
          return node
        }
        
        // 方法2: 查找父节点的最新子节点
        if (parentNode && parentNode.children && parentNode.children.length > 0) {
          const lastChild = parentNode.children[parentNode.children.length - 1]
          if (lastChild && lastChild.getData('isAIResponse')) {
            console.log(`🔍 [节点查找] ✅ 通过父节点最新子节点找到AI节点`)
            return lastChild
          }
        }
        
        // 方法3: 遍历所有节点查找AI回答节点
        if (this.mindMap && this.mindMap.getAllNodes) {
          const allNodes = this.mindMap.getAllNodes()
          const aiNodes = allNodes.filter(node => node.getData('isAIResponse'))
          if (aiNodes.length > 0) {
            const latestAINode = aiNodes[aiNodes.length - 1]
            if (latestAINode && latestAINode.parent === parentNode) {
              console.log(`🔍 [节点查找] ✅ 通过遍历找到最新AI节点`)
              return latestAINode
            }
          }
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
      
      console.warn(`🔍 [节点查找] ❌ 重试${maxRetries}次后仍未找到节点: ${uid}`)
      return null
    },

    /**
     * 查找父节点的最新子节点
     * @param {Object} parentNode - 父节点
     * @returns {Object|null} 最新子节点
     */
    findLatestChildNode(parentNode) {
      if (!parentNode || !parentNode.children || parentNode.children.length === 0) {
        return null
      }
      
      // 查找最新的AI回答子节点
      const aiChildren = parentNode.children.filter(child => child.getData('isAIResponse'))
      if (aiChildren.length > 0) {
        return aiChildren[aiChildren.length - 1]
      }
      
      // 如果没有AI子节点，返回最新的子节点
      return parentNode.children[parentNode.children.length - 1]
    },

    /**
     * 查找父节点的最新AI子节点（带重试）
     * @param {Object} parentNode - 父节点
     * @returns {Promise<Object|null>} 最新AI子节点
     */
    async findLatestAIChildNode(parentNode) {
      const maxRetries = 15
      const retryDelay = 100 // ms
      
      for (let i = 0; i < maxRetries; i++) {
        console.log(`🔍 [AI节点查找] 第${i + 1}次尝试查找最新AI子节点`)
        
        // 等待思维导图渲染完成
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        
        if (parentNode && parentNode.children && parentNode.children.length > 0) {
          // 查找最新的AI回答子节点
          const aiChildren = parentNode.children.filter(child => {
            const isAI = child.getData('isAIResponse')
            console.log(`🔍 [AI节点查找] 检查子节点:`, {
              text: child.getData('text'),
              isAIResponse: isAI,
              uid: child.getData('uid') || child.uid
            })
            return isAI
          })
          
          if (aiChildren.length > 0) {
            const latestAIChild = aiChildren[aiChildren.length - 1]
            console.log(`🔍 [AI节点查找] ✅ 找到AI子节点:`, latestAIChild)
            return latestAIChild
          }
        }
        
        console.log(`🔍 [AI节点查找] 第${i + 1}次未找到，等待重试...`)
      }
      
      console.warn(`🔍 [AI节点查找] ❌ 重试${maxRetries}次后仍未找到AI子节点`)
      return null
    },

    /**
     * 应用AI节点完成样式
     * @param {Object} node - 节点实例
     */
    applyAINodeCompleteStyle(node) {
      // 这里可以添加自定义样式逻辑
      const element = node.group?.node || node.el
      if (element) {
        element.classList.add('ai-response-complete')
        element.classList.remove('ai-response-loading')
      }
    },

    /**
     * 应用AI节点错误样式
     * @param {Object} node - 节点实例
     */
    applyAINodeErrorStyle(node) {
      const element = node.group?.node || node.el
      if (element) {
        element.classList.add('ai-response-error')
        element.classList.remove('ai-response-loading')
      }
    },

    /**
     * 启用/禁用AI自动回答功能
     * @param {boolean} enabled - 是否启用
     */
    setAIResponseEnabled(enabled) {
      this.aiResponseEnabled = Boolean(enabled)
      console.log(`AI自动回答功能${enabled ? '已启用' : '已禁用'}`)
    },

    /**
     * 手动为节点生成AI回答
     * @param {Object} node - 目标节点
     */
    manualGenerateAIResponse(node) {
      if (!node) return
      
      const text = node.getData('text') || node.text
      if (text) {
        this.generateAIResponse(node, text)
      }
    },

    /**
     * 清理AI相关数据
     */
    cleanupAIData() {
      this.aiResponseNodes.clear()
      this.pendingAIRequests.clear()
      console.log('AI相关数据已清理')
    },

    /**
     * 增强的markdown渲染降级方案
     * @param {string} markdown - markdown内容
     * @returns {string} 增强HTML
     */
    simpleMarkdownToHtml(markdown) {
      if (!markdown) return ''
      
      let html = markdown
      
      // 处理代码块（需要在其他处理之前，避免内容被误处理）
      html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || ''
        const cleanCode = code.trim()
        return `<pre><code class="language-${language}">${cleanCode}</code></pre>`
      })
      
      // 处理标题（支持更多级别）
      html = html.replace(/^#{6}\s+(.*$)/gm, '<h6>$1</h6>')
      html = html.replace(/^#{5}\s+(.*$)/gm, '<h5>$1</h5>')
      html = html.replace(/^#{4}\s+(.*$)/gm, '<h4>$1</h4>')
      html = html.replace(/^#{3}\s+(.*$)/gm, '<h3>$1</h3>')
      html = html.replace(/^#{2}\s+(.*$)/gm, '<h2>$1</h2>')
      html = html.replace(/^#{1}\s+(.*$)/gm, '<h1>$1</h1>')
      
      // 处理引用块
      html = html.replace(/^>\s+(.*$)/gm, '<blockquote>$1</blockquote>')
      
      // 处理粗体和斜体（更精确的匹配）
      html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
      
      // 处理行内代码
      html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
      
      // 处理链接
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      
      // 处理水平分割线
      html = html.replace(/^---+$/gm, '<hr>')
      
      // 处理嵌套列表（改进版本）
      const lines = html.split('\n')
      let inList = false
      let listLevel = 0
      let processedLines = []
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmedLine = line.trim()
        
        // 检测列表项
        const listMatch = line.match(/^(\s*)[-*+]\s+(.*)$/)
        const orderedListMatch = line.match(/^(\s*)\d+\.\s+(.*)$/)
        
        if (listMatch || orderedListMatch) {
          const indent = (listMatch || orderedListMatch)[1].length
          const content = (listMatch || orderedListMatch)[2]
          const currentLevel = Math.floor(indent / 2)
          
          if (!inList) {
            // 开始新列表
            const listTag = orderedListMatch ? 'ol' : 'ul'
            processedLines.push(`<${listTag}>`)
            inList = true
            listLevel = currentLevel
          } else if (currentLevel > listLevel) {
            // 嵌套更深的列表
            const listTag = orderedListMatch ? 'ol' : 'ul'
            processedLines.push(`<${listTag}>`)
            listLevel = currentLevel
          } else if (currentLevel < listLevel) {
            // 回到上一级列表
            while (listLevel > currentLevel) {
              processedLines.push('</ul>')
              listLevel--
            }
          }
          
          processedLines.push(`<li>${content}</li>`)
        } else {
          // 非列表项
          if (inList) {
            // 结束列表
            while (listLevel >= 0) {
              processedLines.push('</ul>')
              listLevel--
            }
            inList = false
          }
          
          // 处理段落
          if (trimmedLine === '') {
            processedLines.push('<br>')
          } else if (!trimmedLine.startsWith('<')) {
            processedLines.push(`<p>${line}</p>`)
          } else {
            processedLines.push(line)
          }
        }
      }
      
      // 如果最后还在列表中，关闭列表
      if (inList) {
        while (listLevel >= 0) {
          processedLines.push('</ul>')
          listLevel--
        }
      }
      
      html = processedLines.join('\n')
      
      // 清理多余的空段落和换行
      html = html.replace(/<p>\s*<\/p>/g, '')
      html = html.replace(/<br>\s*<br>/g, '<br>')
      
      return `<div>${html}</div>`
    },

    /**
     * 添加Mermaid样式
     */
    addMermaidStyles() {
      // 避免重复添加样式
      if (document.querySelector('#mermaid-chart-styles')) {
        return
      }

      const style = document.createElement('style')
      style.id = 'mermaid-chart-styles'
      style.textContent = `
        .mermaid-chart-wrapper {
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
          font-size: 12px;
          font-weight: bold;
        }
        .mermaid-chart-container {
          padding: 16px;
          background: white;
          min-height: 100px;
          text-align: center;
        }
        .mermaid-chart-container svg {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
        }
        .mermaid-loading {
          color: #6b7280;
          font-size: 14px;
          padding: 20px;
        }
        .mermaid-error {
          color: #dc2626;
          font-size: 13px;
          padding: 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
          margin: 8px;
        }
      `
      document.head.appendChild(style)
    },

    /**
     * 渲染Mermaid图表（全局版本，避免上下文问题）
     * @param {string} chartId - 图表容器ID
     * @param {string} code - Mermaid代码
     */
    renderMermaidChartGlobal(chartId, code) {
      console.log('🎯 [Mermaid] 开始渲染图表:', chartId)
      
      try {
        const container = document.getElementById(chartId)
        if (!container) {
          console.warn('🎯 [Mermaid] 容器未找到:', chartId)
          return
        }

        console.log('🎯 [Mermaid] 找到容器，开始渲染内容')

        // 显示Mermaid代码和说明（增强对比度和可见性）
        container.innerHTML = `
          <div style="padding: 20px; text-align: left; background: white;">
            <div style="color: #059669; font-weight: 600; margin-bottom: 16px; font-size: 14px; border-bottom: 2px solid #d1fae5; padding-bottom: 8px;">
              📊 Mermaid流程图代码
            </div>
            <div style="background: #1f2937; border: 2px solid #374151; border-radius: 6px; padding: 16px; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; color: #10b981; overflow-x: auto;">${code.trim()}</div>
            <div style="margin-top: 12px; padding: 10px; background: #ecfdf5; border-left: 3px solid #10b981; border-radius: 4px; font-size: 12px; color: #047857;">
              💡 <strong>提示：</strong>此代码可以在支持Mermaid的环境中渲染为流程图（如Typora、Obsidian、GitHub、Notion等）
            </div>
          </div>
        `

        console.log('✅ [Mermaid] 代码显示成功:', chartId)

      } catch (error) {
        console.error('❌ [Mermaid] 处理失败:', error)
        
        const container = document.getElementById(chartId)
        if (container) {
          container.innerHTML = `
            <div style="padding: 16px; color: #dc2626; text-align: center;">
              <div>⚠️ 无法显示图表</div>
              <div style="font-size: 11px; margin-top: 4px;">错误: ${error.message || '未知错误'}</div>
            </div>
          `
        }
      }
    },

    /**
     * 渲染Mermaid图表（保留原方法作为备用）
     * @param {string} chartId - 图表容器ID
     * @param {string} code - Mermaid代码
     */
    async renderMermaidChart(chartId, code) {
      // 直接调用全局版本
      this.renderMermaidChartGlobal(chartId, code)
    },
  },

  // 组件销毁时清理数据
  beforeDestroy() {
    this.cleanupAIData()
  }
} 