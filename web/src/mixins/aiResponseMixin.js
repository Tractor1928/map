import { aiServiceFactory } from '@/services/ai'
import { createUid } from 'simple-mind-map/src/utils'
import { AI_PROMPTS, buildContextPrompt } from '@/config/aiPrompts'
// 修复marked导入方式
const marked = require('marked')

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
    }
  },

  methods: {
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
        const aiNode = await this.createAIResponseNode(node, '🤖 正在思考中...')
        if (!aiNode) {
          throw new Error('创建AI回答节点失败')
        }
        console.log('🚀 [AI生成] AI回答节点创建成功')
        
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
        
        const messages = [
          { 
            role: 'system', 
            content: AI_PROMPTS.getSystemPrompt(hasContext)
          }
        ]
        
        // 如果有上下文，添加具体的上下文信息
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
            console.log('🚀 [AI生成] 流式更新:', content)
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
        console.log('🎨 [Markdown渲染] 检测到markdown格式:', hasMarkdown)

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
     * 检测文本是否包含markdown格式
     * @param {string} text - 文本内容
     * @returns {boolean} 是否包含markdown格式
     */
    detectMarkdownFormat(text) {
      if (!text || typeof text !== 'string') return false
      
      // 检测常见的markdown元素
      const markdownPatterns = [
        /^#{1,6}\s/m,           // 标题 # ## ###
        /\*\*.*?\*\*/,          // 粗体 **text**
        /\*.*?\*/,              // 斜体 *text*
        /\[.*?\]\(.*?\)/,       // 链接 [text](url)
        /^\s*[\*\-\+]\s/m,      // 无序列表 - * +
        /^\s*\d+\.\s/m,         // 有序列表 1. 2.
        /```[\s\S]*?```/,       // 代码块 ```code```
        /`.*?`/,                // 行内代码 `code`
        /^\>/m,                 // 引用 >
        /^\|.*?\|/m,            // 表格 |col1|col2|
        /^---+$/m               // 分割线 ---
      ]
      
      return markdownPatterns.some(pattern => pattern.test(text))
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
        
        // 根据标题级别设置更明显的样式差异
        let fontSize, fontWeight, color, marginTop, marginBottom
        
        switch(level) {
          case 1:
            fontSize = '20px'
            fontWeight = 'bold'
            color = '#1a202c'
            marginTop = '16px'
            marginBottom = '8px'
            break
          case 2:
            fontSize = '18px'
            fontWeight = 'bold'
            color = '#2d3748'
            marginTop = '14px'
            marginBottom = '6px'
            break
          case 3:
            fontSize = '16px'
            fontWeight = 'bold'
            color = '#4a5568'
            marginTop = '12px'
            marginBottom = '4px'
            break
          case 4:
            fontSize = '15px'
            fontWeight = '600'
            color = '#718096'
            marginTop = '10px'
            marginBottom = '4px'
            break
          case 5:
            fontSize = '14px'
            fontWeight = '600'
            color = '#a0aec0'
            marginTop = '8px'
            marginBottom = '2px'
            break
          default: // h6
            fontSize = '13px'
            fontWeight = '500'
            color = '#cbd5e0'
            marginTop = '6px'
            marginBottom = '2px'
        }
        
        span.style.fontSize = fontSize
        span.style.fontWeight = fontWeight
        span.style.color = color
        span.style.display = 'block'
        span.style.marginTop = marginTop
        span.style.marginBottom = marginBottom
        span.innerHTML = heading.innerHTML
        
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
      
      // 处理列表项，确保每个li都包装在p标签中
      const listItems = tempDiv.querySelectorAll('li')
      listItems.forEach(li => {
        if (!li.querySelector('p')) {
          const p = document.createElement('p')
          const span = document.createElement('span')
          span.style.marginBottom = '4px'
          span.innerHTML = li.innerHTML
          p.appendChild(span)
          li.innerHTML = ''
          li.appendChild(p)
        }
      })
      
      // 处理代码块
      const codeBlocks = tempDiv.querySelectorAll('pre code')
      codeBlocks.forEach(code => {
        const pre = code.parentElement
        const p = document.createElement('p')
        const span = document.createElement('span')
        
        span.style.fontFamily = 'monospace'
        span.style.backgroundColor = 'rgba(240, 240, 240, 0.3)'  // 半透明背景
        span.style.padding = '8px 12px'
        span.style.borderRadius = '4px'
        span.style.fontSize = '13px'
        span.style.display = 'block'
        span.style.whiteSpace = 'pre-wrap'  // 保持换行和空格
        span.style.wordBreak = 'break-word'
        span.style.lineHeight = '1.4'
        span.style.border = '1px solid rgba(225, 228, 232, 0.5)'  // 半透明边框
        span.style.marginTop = '8px'
        span.style.marginBottom = '8px'
        
        // 保持原始的文本内容，包括换行
        span.textContent = code.textContent || code.innerText
        
        p.appendChild(span)
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
     * 简单的markdown渲染降级方案
     * @param {string} markdown - markdown内容
     * @returns {string} 简单HTML
     */
    simpleMarkdownToHtml(markdown) {
      if (!markdown) return ''
      
      let html = markdown
      
      // 处理标题
      html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>')
      html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>')
      html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>')
      
      // 处理粗体和斜体
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
      
      // 处理行内代码
      html = html.replace(/`(.*?)`/g, '<code>$1</code>')
      
      // 处理代码块
      html = html.replace(/```[\s\S]*?```/g, (match) => {
        const code = match.replace(/```.*?\n/, '').replace(/```$/, '')
        return `<pre><code>${code}</code></pre>`
      })
      
      // 处理链接
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      
      // 处理换行
      html = html.replace(/\n/g, '<br>')
      
      // 处理列表（简单版本）
      html = html.replace(/^- (.*$)/gm, '<li>$1</li>')
      html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      
      return `<div>${html}</div>`
    },
  },

  // 组件销毁时清理数据
  beforeDestroy() {
    this.cleanupAIData()
  }
} 