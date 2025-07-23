import Style from './Style'
import Shape from './Shape'
import { G, Rect, Text, SVG } from '@svgdotjs/svg.js'
import nodeGeneralizationMethods from './nodeGeneralization'
import nodeExpandBtnMethods from './nodeExpandBtn'
import nodeCommandWrapsMethods from './nodeCommandWraps'
import nodeCreateContentsMethods from './nodeCreateContents'
import nodeExpandBtnPlaceholderRectMethods from './nodeExpandBtnPlaceholderRect'
import nodeModifyWidthMethods from './nodeModifyWidth'
import nodeCooperateMethods from './nodeCooperate'
import quickCreateChildBtnMethods from './quickCreateChildBtn'
import nodeLayoutMethods from './nodeLayout'
import { CONSTANTS } from '../../../constants/constant'
import { copyNodeTree, createUid, addXmlns } from '../../../utils/index'

//  节点类
class MindMapNode {
  //  构造函数
  constructor(opt = {}) {
    this.opt = opt
    // 节点数据
    this.nodeData = this.handleData(opt.data || {})
    // 保存本次更新时的节点数据快照
    this.nodeDataSnapshot = ''
    // uid
    this.uid = opt.uid
    // 控制实例
    this.mindMap = opt.mindMap
    // 渲染实例
    this.renderer = opt.renderer
    // 渲染器
    this.draw = this.mindMap.draw
    this.nodeDraw = this.mindMap.nodeDraw
    this.lineDraw = this.mindMap.lineDraw
    // 样式实例
    this.style = new Style(this)
    // 节点当前生效的全部样式
    this.effectiveStyles = {}
    // 形状实例
    this.shapeInstance = new Shape(this)
    this.shapePadding = {
      paddingX: 0,
      paddingY: 0
    }
    // 是否是根节点
    this.isRoot = opt.isRoot === undefined ? false : opt.isRoot
    // 是否是概要节点
    this.isGeneralization =
      opt.isGeneralization === undefined ? false : opt.isGeneralization
    this.generalizationBelongNode = null
    // 节点层级
    this.layerIndex = opt.layerIndex === undefined ? 0 : opt.layerIndex
    // 节点宽
    this.width = opt.width || 0
    // 节点高
    this.height = opt.height || 0
    // 自定义文本的宽度
    this.customTextWidth = opt.data.data.customTextWidth || undefined
    // left
    this._left = opt.left || 0
    // top
    this._top = opt.top || 0
    // 自定义位置
    this.customLeft = opt.data.data.customLeft || undefined
    this.customTop = opt.data.data.customTop || undefined
    // 是否正在拖拽中
    this.isDrag = false
    // 父节点
    this.parent = opt.parent || null
    // 子节点
    this.children = opt.children || []
    // 当前同时操作该节点的用户列表
    this.userList = []
    // 节点内容的容器
    this.group = null
    this.shapeNode = null // 节点形状节点
    this.hoverNode = null // 节点hover和激活的节点
    // 节点内容对象
    this._customNodeContent = null
    this._imgData = null
    this._iconData = null
    this._textData = null
    this._hyperlinkData = null
    this._tagData = null
    this._noteData = null
    this.noteEl = null
    this.noteContentIsShow = false
    this._attachmentData = null
    this._prefixData = null
    this._postfixData = null
    this._expandBtn = null
    this._lastExpandBtnType = null
    this._showExpandBtn = false
    this._openExpandNode = null
    this._closeExpandNode = null
    this._fillExpandNode = null
    this._userListGroup = null
    this._lines = []
    this._generalizationList = []
    this._unVisibleRectRegionNode = null
    this._isMouseenter = false
    this._customContentAddToNodeAdd = null
    // 尺寸信息
    this._rectInfo = {
      textContentWidth: 0,
      textContentHeight: 0,
      textContentWidthWithoutTag: 0
    }
    // 概要节点的宽高
    this._generalizationNodeWidth = 0
    this._generalizationNodeHeight = 0
    // 展开收缩按钮尺寸
    this.expandBtnSize = this.mindMap.opt.expandBtnSize
    // 是否是多选节点
    this.isMultipleChoice = false
    // 是否需要重新layout
    this.needLayout = false
    // 当前是否是隐藏状态
    this.isHide = false
    const proto = Object.getPrototypeOf(this)
    if (!proto.bindEvent) {
      // 节点尺寸计算和布局相关方法
      Object.keys(nodeLayoutMethods).forEach(item => {
        proto[item] = nodeLayoutMethods[item]
      })
      // 概要相关方法
      Object.keys(nodeGeneralizationMethods).forEach(item => {
        proto[item] = nodeGeneralizationMethods[item]
      })
      // 展开收起按钮相关方法
      Object.keys(nodeExpandBtnMethods).forEach(item => {
        proto[item] = nodeExpandBtnMethods[item]
      })
      // 展开收起按钮占位元素相关方法
      Object.keys(nodeExpandBtnPlaceholderRectMethods).forEach(item => {
        proto[item] = nodeExpandBtnPlaceholderRectMethods[item]
      })
      // 命令的相关方法
      Object.keys(nodeCommandWrapsMethods).forEach(item => {
        proto[item] = nodeCommandWrapsMethods[item]
      })
      // 创建节点内容的相关方法
      Object.keys(nodeCreateContentsMethods).forEach(item => {
        proto[item] = nodeCreateContentsMethods[item]
      })
      // 协同相关
      if (this.mindMap.cooperate) {
        Object.keys(nodeCooperateMethods).forEach(item => {
          proto[item] = nodeCooperateMethods[item]
        })
      }
      // 拖拽调整节点宽度
      Object.keys(nodeModifyWidthMethods).forEach(item => {
        proto[item] = nodeModifyWidthMethods[item]
      })
      // 快捷创建子节点按钮
      if (this.mindMap.opt.isShowCreateChildBtnIcon) {
        Object.keys(quickCreateChildBtnMethods).forEach(item => {
          proto[item] = quickCreateChildBtnMethods[item]
        })
        this.initQuickCreateChildBtn()
      }
      proto.bindEvent = true
    }
    // 初始化
    this.getSize()
    // 初始需要计算一下概要节点的大小，否则计算布局时获取不到概要的大小
    this.updateGeneralization()
    this.initDragHandle()
  }

  // 支持自定义位置
  get left() {
    return this.customLeft || this._left
  }

  set left(val) {
    this._left = val
  }

  get top() {
    return this.customTop || this._top
  }

  set top(val) {
    this._top = val
  }

  //  复位部分布局时会重新设置的数据
  reset() {
    this.children = []
    this.parent = null
    this.isRoot = false
    this.layerIndex = 0
    this.left = 0
    this.top = 0
  }

  // 节点被删除时需要复位的数据
  resetWhenDelete() {
    this._isMouseenter = false
  }

  //  处理数据
  handleData(data) {
    data.data.expand = data.data.expand === false ? false : true
    data.data.isActive = data.data.isActive === true ? true : false
    data.children = data.children || []
    return data
  }

  //  创建节点的各个内容对象数据
  // recreateTypes：[] custom、image、icon、text、hyperlink、tag、note、attachment、numbers、prefix、postfix、checkbox
  createNodeData(recreateTypes) {
    // 自定义节点内容
    const {
      isUseCustomNodeContent,
      customCreateNodeContent,
      createNodePrefixContent,
      createNodePostfixContent,
      addCustomContentToNode
    } = this.mindMap.opt
    // 需要创建的内容类型
    const typeList = [
      'custom',
      'image',
      'icon',
      'text',
      'hyperlink',
      'tag',
      'note',
      'attachment',
      'prefix',
      'postfix',
      ...this.mindMap.nodeInnerPrefixList.map(item => {
        return item.name
      }),
      ...this.mindMap.nodeInnerPostfixList.map(item => {
        return item.name
      })
    ]
    const createTypes = {}
    if (Array.isArray(recreateTypes)) {
      // 重新创建指定的内容类型
      typeList.forEach(item => {
        if (recreateTypes.includes(item)) {
          createTypes[item] = true
        }
      })
    } else {
      // 创建所有类型
      typeList.forEach(item => {
        createTypes[item] = true
      })
    }
    if (
      isUseCustomNodeContent &&
      customCreateNodeContent &&
      createTypes.custom
    ) {
      this._customNodeContent = customCreateNodeContent(this)
    }
    // 如果没有返回内容，那么还是使用内置的节点内容
    if (this._customNodeContent) {
      addXmlns(this._customNodeContent)
      return
    }
    if (createTypes.image) this._imgData = this.createImgNode()
    if (createTypes.icon) this._iconData = this.createIconNode()
    if (createTypes.text) this._textData = this.createTextNode()
    if (createTypes.hyperlink) this._hyperlinkData = this.createHyperlinkNode()
    if (createTypes.tag) this._tagData = this.createTagNode()
    if (createTypes.note) this._noteData = this.createNoteNode()
    if (createTypes.attachment)
      this._attachmentData = this.createAttachmentNode()
    this.mindMap.nodeInnerPrefixList.forEach(item => {
      if (createTypes[item.name]) {
        this[`_${item.name}Data`] = item.createContent(this)
      }
    })
    if (createTypes.prefix) {
      this._prefixData = createNodePrefixContent
        ? createNodePrefixContent(this)
        : null
      if (this._prefixData && this._prefixData.el) {
        addXmlns(this._prefixData.el)
      }
    }
    if (createTypes.postfix) {
      this._postfixData = createNodePostfixContent
        ? createNodePostfixContent(this)
        : null
      if (this._postfixData && this._postfixData.el) {
        addXmlns(this._postfixData.el)
      }
    }
    this.mindMap.nodeInnerPostfixList.forEach(item => {
      if (createTypes[item.name]) {
        this[`_${item.name}Data`] = item.createContent(this)
      }
    })
    if (
      addCustomContentToNode &&
      typeof addCustomContentToNode.create === 'function'
    ) {
      this._customContentAddToNodeAdd = addCustomContentToNode.create(this)
      if (
        this._customContentAddToNodeAdd &&
        this._customContentAddToNodeAdd.el
      ) {
        addXmlns(this._customContentAddToNodeAdd.el)
      }
    }
  }

  //  计算节点的宽高
  getSize(recreateTypes, opt = {}) {
    const ignoreUpdateCustomTextWidth = opt.ignoreUpdateCustomTextWidth || false
    if (!ignoreUpdateCustomTextWidth) {
      this.customTextWidth = this.getData('customTextWidth') || undefined
    }
    this.customLeft = this.getData('customLeft') || undefined
    this.customTop = this.getData('customTop') || undefined
    // 这里不要更新概要，不然即使概要没修改，每次也会重新渲染
    // this.updateGeneralization()
    this.createNodeData(recreateTypes)
    const { width, height } = this.getNodeRect()
    // 判断节点尺寸是否有变化
    const changed = this.width !== width || this.height !== height
    this.width = width
    this.height = height
    return changed
  }

  // 处理文字选择事件，显示问号图标
  handleTextSelection(e) {
    console.log('🎯 [文字选择] 文字选择事件触发:', {
      事件类型: e.type,
      鼠标按键: e.which || e.button,
      当前节点: this.getData('text'),
      时间戳: Date.now()
    })
    
    // 延迟执行，确保选择已完成
    setTimeout(() => {
      try {
        const selection = window.getSelection()
        console.log('🎯 [文字选择] Selection状态:', {
          selection,
          rangeCount: selection ? selection.rangeCount : 0,
          selectionType: selection ? selection.type : 'none',
          isCollapsed: selection ? selection.isCollapsed : 'unknown'
        })
        
        if (!selection || selection.rangeCount === 0) {
          console.log('🎯 [文字选择] 没有选择，隐藏问号图标')
          this.hideQuestionIcon()
          return
        }
        
        const selectedText = selection.toString().trim()
        console.log('🎯 [文字选择] 选中文字分析:', {
          原始文字: `"${selection.toString()}"`,
          清理后文字: `"${selectedText}"`,
          文字长度: selectedText.length,
          满足长度要求: selectedText.length >= 2
        })
        
        if (!selectedText || selectedText.length < 2) {
          console.log('🎯 [文字选择] 选择的文字太短，隐藏问号图标')
          this.hideQuestionIcon()
          return
        }
        
        // 检查选中的文字是否在当前节点内
        const range = selection.getRangeAt(0)
        const nodeElement = this.group.node
        const isInCurrentNode = nodeElement.contains(range.commonAncestorContainer) || 
                               nodeElement === range.commonAncestorContainer
        
        console.log('🎯 [文字选择] 节点包含检查:', {
          当前节点元素: nodeElement,
          选择的公共祖先: range.commonAncestorContainer,
          选择是否在当前节点内: isInCurrentNode,
          commonAncestorContainer类型: range.commonAncestorContainer.nodeType === Node.TEXT_NODE ? 
            'TextNode' : range.commonAncestorContainer.tagName || range.commonAncestorContainer.nodeName
        })
        
        if (!isInCurrentNode) {
          console.log('🎯 [文字选择] 选择不在当前节点内，忽略')
          return
        }
        
        console.log('🎯 [文字选择] 检测到有效选中文字:', selectedText)
        console.log('🎯 [文字选择] 当前节点:', this.getData('text'))
        
        // 获取鼠标位置信息
        const mousePosition = {
          clientX: e.clientX,
          clientY: e.clientY,
          pageX: e.pageX,
          pageY: e.pageY
        }
        
        console.log('🎯 [文字选择] 鼠标释放位置:', mousePosition)
        
        // 显示问号图标而不是立即创建节点，使用鼠标位置
        this.showQuestionIcon(selectedText, range, mousePosition)
        
      } catch (error) {
        console.error('🎯 [文字选择] 处理文字选择时出错:', error)
      }
    }, 50)
  }

  // 从选中文字创建提问节点
  createQuestionNodeFromSelection(selectedText) {
    try {
      console.log('🤔 [提问节点] 开始创建提问节点:', selectedText)
      
             // 生成唯一ID（使用simple-mind-map的工具函数）
       const uid = 'question_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      
      // 创建子节点数据
      const questionNodeData = {
        text: selectedText,
        isQuestion: true, // 标记为提问节点
        uid: uid
      }
      
      console.log('🤔 [提问节点] 节点数据:', questionNodeData)
      
      // 使用思维导图API创建子节点
      this.mindMap.execCommand('INSERT_CHILD_NODE', false, [this], questionNodeData, [])
      
      console.log('🤔 [提问节点] 提问节点创建完成')
      
      // 延迟查找创建的节点并触发AI回答
      setTimeout(() => {
        this.findAndTriggerAIResponse(uid, selectedText)
      }, 100)
      
    } catch (error) {
      console.error('🤔 [提问节点] 创建提问节点失败:', error)
    }
  }

  // 显示问号图标
  showQuestionIcon(selectedText, range, mousePosition) {
    try {
      console.log('❓ [问号图标] 显示问号图标:', selectedText)
      console.log('❓ [问号图标] 原始range信息:', {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
        collapsed: range.collapsed,
        commonAncestorContainer: range.commonAncestorContainer
      })
      
      // 先隐藏之前的图标
      this.hideQuestionIcon()
      
      // 保存选中的文字和范围
      this.selectedTextForQuestion = selectedText
      this.selectedRange = range
      
      // 获取页面滚动和缩放信息
      const pageScrollInfo = {
        scrollX: window.pageXOffset || document.documentElement.scrollLeft,
        scrollY: window.pageYOffset || document.documentElement.scrollTop,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      }
      
      // 获取思维导图的变换信息
      const drawTransform = this.mindMap.draw.transform()
      
      console.log('❓ [问号图标] 页面和变换信息:', {
        页面滚动: pageScrollInfo,
        思维导图变换: drawTransform,
        画布尺寸: {
          width: this.mindMap.width,
          height: this.mindMap.height
        }
      })
      
      // 获取选择范围的位置信息
      const nodeRect = this.group.node.getBoundingClientRect()
      console.log('❓ [问号图标] 节点位置信息:', {
        nodeRect,
        nodeDimensions: {
          width: this.width,
          height: this.height,
          left: this.left,
          top: this.top
        }
      })
      
      // 获取原始选择范围的位置（仅用于调试）
      const originalRangeRect = range.getBoundingClientRect()
      console.log('❓ [问号图标] 原始选择范围位置:', originalRangeRect)
      
      // 确定使用哪种位置计算方式
      let useMousePosition = false
      if (mousePosition && mousePosition.clientX !== undefined && mousePosition.clientY !== undefined) {
        useMousePosition = true
        console.log('❓ [问号图标] 使用鼠标释放位置:', {
          mousePosition,
          说明: '使用鼠标释放位置作为图标定位基准'
        })
      } else {
        console.log('❓ [问号图标] 鼠标位置无效，回退到文字选择结束位置')
      }
      
      // 获取变换参数
      const drawTransformInverse = this.mindMap.draw.transform()
      const { scaleX, scaleY, translateX, translateY } = drawTransformInverse
      
      let canvasX, canvasY
      
      if (useMousePosition) {
        // 使用鼠标位置
        canvasX = (mousePosition.clientX - translateX) / scaleX
        canvasY = (mousePosition.clientY - translateY) / scaleY
      } else {
        // 回退到文字选择结束位置
        const endRange = document.createRange()
        endRange.setStart(range.endContainer, range.endOffset)
        endRange.setEnd(range.endContainer, range.endOffset)
        const endRect = endRange.getBoundingClientRect()
        endRange.detach()
        
        canvasX = (endRect.left - translateX) / scaleX
        canvasY = (endRect.top - translateY) / scaleY
        
        console.log('❓ [问号图标] 使用文字选择结束位置:', {
          endRect,
          canvasX,
          canvasY
        })
      }
      
      // 计算图标位置（相对于节点，在目标位置的右上方）
      let iconX = canvasX - this.left + 5
      let iconY = canvasY - this.top - 30
      const iconSize = 24
      
      // 边界检查，确保图标在节点范围内
      const minX = 5
      const maxX = this.width - iconSize - 5
      const minY = -iconSize - 5
      const maxY = this.height - 5
      
      // 应用边界限制
      const originalIconX = iconX
      const originalIconY = iconY
      iconX = Math.max(minX, Math.min(maxX, iconX))
      iconY = Math.max(minY, Math.min(maxY, iconY))
      
      console.log('❓ [问号图标] 边界检查:', {
        原始位置: { x: originalIconX, y: originalIconY },
        边界限制: { minX, maxX, minY, maxY },
        最终位置: { x: iconX, y: iconY },
        是否调整: originalIconX !== iconX || originalIconY !== iconY
      })
      
      console.log('❓ [问号图标] 坐标转换详情:', {
        使用的定位方式: useMousePosition ? '鼠标释放位置' : '文字选择结束位置',
        变换参数: {
          scaleX, scaleY, translateX, translateY
        },
        画布坐标: {
          canvasX,
          canvasY
        },
        节点位置: {
          node_left: this.left,
          node_top: this.top
        }
      })
      
      console.log('❓ [问号图标] 位置计算:', {
        计算公式: {
          iconX: `${canvasX} - ${this.left} + 5 = ${iconX}`,
          iconY: `${canvasY} - ${this.top} - 30 = ${iconY}`
        },
        最终位置: { iconX, iconY, iconSize },
        相对于节点的位置: `(${iconX}, ${iconY})`,
        节点尺寸参考: `节点宽度: ${this.width}, 节点高度: ${this.height}`,
        定位说明: useMousePosition ? '基于鼠标释放位置的右上方' : '基于文字选择结束位置的右上方'
      })
      
      // 创建问号图标
      this.questionIcon = this.group.circle(iconSize)
        .fill('#1890ff')
        .stroke({ color: '#ffffff', width: 2 })
        .addClass('smm-question-icon')
        .css({
          cursor: 'pointer',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        })
        .move(iconX, iconY)
      
      console.log('❓ [问号图标] 图标创建完成:', {
        圆圈位置: { x: iconX, y: iconY },
        圆圈大小: iconSize,
        图标元素: this.questionIcon.node
      })
      
      // 添加问号文字（居中在圆形图标内）
      const textX = iconX + iconSize / 2 - 5
      const textY = iconY + iconSize / 2 - 9
      
      this.questionIconText = this.group.text('?')
        .font({
          size: 16,
          family: 'Arial, sans-serif',
          weight: 'bold'
        })
        .fill('#ffffff')
        .addClass('smm-question-icon-text')
        .css({
          cursor: 'pointer',
          userSelect: 'none',
          pointerEvents: 'none'
        })
        .attr({
          'text-anchor': 'middle',
          'dominant-baseline': 'central'
        })
        .move(textX, textY)
      
      console.log('❓ [问号图标] 文字创建完成:', {
        文字位置: { x: textX, y: textY },
        文字计算: `x: ${iconX} + ${iconSize}/2 - 5 = ${textX}, y: ${iconY} + ${iconSize}/2 - 9 = ${textY}`,
        文字元素: this.questionIconText.node
      })
      
      // 绑定点击事件
      this.questionIcon.on('click', (e) => {
        e.stopPropagation()
        this.onQuestionIconClick()
      })
      
      // 添加动画效果
      this.questionIcon.animate(200, 0).scale(1.1).animate(200, 0).scale(1)
      
      console.log('❓ [问号图标] 问号图标显示完成')
      
      // 设置全局点击监听，点击其他地方时隐藏图标
      this.setupGlobalClickListener()
      
    } catch (error) {
      console.error('❓ [问号图标] 显示问号图标失败:', error)
    }
  }

  // 隐藏问号图标
  hideQuestionIcon() {
    try {
      if (this.questionIcon) {
        this.questionIcon.remove()
        this.questionIcon = null
      }
      
      if (this.questionIconText) {
        this.questionIconText.remove()
        this.questionIconText = null
      }
      
      // 清理选择数据
      this.selectedTextForQuestion = null
      this.selectedRange = null
      
      // 移除全局点击监听
      this.removeGlobalClickListener()
      
      console.log('❓ [问号图标] 问号图标已隐藏')
    } catch (error) {
      console.error('❓ [问号图标] 隐藏问号图标失败:', error)
    }
  }

  // 问号图标点击事件
  onQuestionIconClick() {
    try {
      console.log('🎯 [问号点击] 用户点击了问号图标')
      
      if (!this.selectedTextForQuestion) {
        console.warn('🎯 [问号点击] 没有保存的选中文字')
        return
      }
      
      // 创建提问节点
      this.createQuestionNodeFromSelection(this.selectedTextForQuestion)
      
      // 隐藏问号图标
      this.hideQuestionIcon()
      
      // 清除文字选择
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
      }
      
      console.log('🎯 [问号点击] 提问节点创建完成')
      
    } catch (error) {
      console.error('🎯 [问号点击] 处理点击事件失败:', error)
    }
  }

  // 设置全局点击监听
  setupGlobalClickListener() {
    this.globalClickHandler = (e) => {
      // 如果点击的不是问号图标或其父节点，则隐藏图标
      if (!e.target.closest('.smm-question-icon') && 
          !e.target.closest('.smm-question-icon-text')) {
        this.hideQuestionIcon()
      }
    }
    
    document.addEventListener('click', this.globalClickHandler, true)
    
    // ESC键也可以取消
    this.escKeyHandler = (e) => {
      if (e.key === 'Escape') {
        this.hideQuestionIcon()
      }
    }
    
    document.addEventListener('keydown', this.escKeyHandler)
  }

  // 移除全局点击监听
  removeGlobalClickListener() {
    if (this.globalClickHandler) {
      document.removeEventListener('click', this.globalClickHandler, true)
      this.globalClickHandler = null
    }
    
    if (this.escKeyHandler) {
      document.removeEventListener('keydown', this.escKeyHandler)
      this.escKeyHandler = null
    }
  }

  // 查找创建的提问节点并触发AI回答
  findAndTriggerAIResponse(questionNodeUid, questionText) {
    try {
      console.log('🔍 [AI触发] 查找提问节点:', questionNodeUid)
      
      // 查找创建的提问节点
      let questionNode = null
      
      // 在子节点中查找
      if (this.children && this.children.length > 0) {
        questionNode = this.children.find(child => {
          const childUid = child.getData('uid') || child.uid
          return childUid === questionNodeUid || child.getData('isQuestion')
        })
        
        // 如果没找到，取最新的子节点
        if (!questionNode) {
          questionNode = this.children[this.children.length - 1]
        }
      }
      
      console.log('🔍 [AI触发] 找到提问节点:', questionNode)
      
      if (questionNode) {
        // 触发AI回答生成（通过mindMap事件）
        this.mindMap.emit('generate_ai_response_for_selection', questionNode, questionText)
        console.log('🔍 [AI触发] 已触发AI回答生成事件')
      } else {
        console.warn('🔍 [AI触发] 未找到创建的提问节点')
      }
    } catch (error) {
      console.error('🔍 [AI触发] 查找提问节点或触发AI回答失败:', error)
    }
  }

  // 给节点绑定事件
  bindGroupEvent() {
    // 单击事件，选中节点
    this.group.on('click', e => {
      this.mindMap.emit('node_click', this, e)
      if (this.isMultipleChoice) {
        e.stopPropagation()
        this.isMultipleChoice = false
        return
      }
      if (
        this.mindMap.opt.onlyOneEnableActiveNodeOnCooperate &&
        this.userList.length > 0
      ) {
        return
      }
      this.active(e)
    })
    this.group.on('mousedown', e => {
      const {
        readonly,
        enableCtrlKeyNodeSelection,
        useLeftKeySelectionRightKeyDrag,
        mousedownEventPreventDefault
      } = this.mindMap.opt
      if (mousedownEventPreventDefault) {
        e.preventDefault()
      }
      // 只读模式不需要阻止冒泡
      if (!readonly) {
        if (this.isRoot) {
          // 根节点，右键拖拽画布模式下不需要阻止冒泡
          if (e.which === 3 && !useLeftKeySelectionRightKeyDrag) {
            e.stopPropagation()
          }
        } else {
          // 非根节点，且按下的是非鼠标中键，需要阻止事件冒泡
          if (e.which !== 2) {
            e.stopPropagation()
          }
        }
      }
      // 多选和取消多选
      if (!readonly && (e.ctrlKey || e.metaKey) && enableCtrlKeyNodeSelection) {
        this.isMultipleChoice = true
        const isActive = this.getData('isActive')
        if (!isActive)
          this.mindMap.emit(
            'before_node_active',
            this,
            this.renderer.activeNodeList
          )
        this.mindMap.renderer[
          isActive ? 'removeNodeFromActiveList' : 'addNodeToActiveList'
        ](this, true)
        this.renderer.emitNodeActiveEvent(isActive ? null : this)
      }
      this.mindMap.emit('node_mousedown', this, e)
    })
    this.group.on('mouseup', e => {
      if (!this.isRoot && e.which !== 2 && !this.mindMap.opt.readonly) {
        e.stopPropagation()
      }
      this.mindMap.emit('node_mouseup', this, e)
      
      // 检测文字选择并创建提问节点，传递鼠标位置
      this.handleTextSelection(e)
    })
    this.group.on('mouseenter', e => {
      if (this.isDrag) return
      this._isMouseenter = true
      // 显示展开收起按钮
      this.showExpandBtn()
      if (this.isGeneralization) {
        this.handleGeneralizationMouseenter()
      }
      this.mindMap.emit('node_mouseenter', this, e)
    })
    this.group.on('mouseleave', e => {
      if (!this._isMouseenter) return
      this._isMouseenter = false
      this.hideExpandBtn()
      if (this.isGeneralization) {
        this.handleGeneralizationMouseleave()
      }
      this.mindMap.emit('node_mouseleave', this, e)
    })
    // 双击事件
    this.group.on('dblclick', e => {
      const { readonly, onlyOneEnableActiveNodeOnCooperate } = this.mindMap.opt
      if (readonly || e.ctrlKey || e.metaKey) {
        return
      }
      e.stopPropagation()
      if (onlyOneEnableActiveNodeOnCooperate && this.userList.length > 0) {
        return
      }
      this.mindMap.emit('node_dblclick', this, e)
    })
    // 右键菜单事件
    this.group.on('contextmenu', e => {
      const { readonly, useLeftKeySelectionRightKeyDrag } = this.mindMap.opt
      // Mac上按住ctrl键点击鼠标左键不知为何触发的是contextmenu事件
      if (readonly || e.ctrlKey) {
        return
      }
      e.stopPropagation()
      e.preventDefault()
      // 如果是多选节点结束，那么不要触发右键菜单事件
      if (
        this.mindMap.select &&
        !useLeftKeySelectionRightKeyDrag &&
        this.mindMap.select.hasSelectRange()
      ) {
        return
      }
      // 如果有且只有当前节点激活了，那么不需要重新激活
      if (
        !(this.getData('isActive') && this.renderer.activeNodeList.length === 1)
      ) {
        this.renderer.clearActiveNodeList()
        this.active(e)
      }
      this.mindMap.emit('node_contextmenu', e, this)
    })
  }

  //  激活节点
  active(e) {
    if (this.mindMap.opt.readonly) {
      return
    }
    e && e.stopPropagation()
    if (this.getData('isActive')) {
      return
    }
    this.mindMap.emit('before_node_active', this, this.renderer.activeNodeList)
    this.renderer.clearActiveNodeList()
    this.renderer.addNodeToActiveList(this, true)
    this.renderer.emitNodeActiveEvent(this)
  }

  // 取消激活该节点
  deactivate() {
    this.mindMap.renderer.removeNodeFromActiveList(this)
    this.mindMap.renderer.emitNodeActiveEvent()
  }

  //  更新节点
  update(forceRender) {
    if (!this.group) {
      return
    }
    this.updateNodeActiveClass()
    this.updateQuestionNodeClass()
    const {
      alwaysShowExpandBtn,
      notShowExpandBtn,
      isShowCreateChildBtnIcon,
      readonly
    } = this.mindMap.opt
    const childrenLength = this.getChildrenLength()
    // 不显示展开收起按钮则不需要处理
    if (!notShowExpandBtn) {
      if (alwaysShowExpandBtn) {
        // 需要移除展开收缩按钮
        if (this._expandBtn && childrenLength <= 0) {
          this.removeExpandBtn()
        } else {
          // 更新展开收起按钮
          this.renderExpandBtn()
        }
      } else {
        const { isActive, expand } = this.getData()
        // 展开状态且非激活状态，且当前鼠标不在它上面，才隐藏
        if (childrenLength <= 0) {
          this.removeExpandBtn()
        } else if (expand && !isActive && !this._isMouseenter) {
          this.hideExpandBtn()
        } else {
          this.showExpandBtn()
        }
      }
    }
    // 更新快速创建子节点按钮
    if (isShowCreateChildBtnIcon) {
      if (childrenLength > 0) {
        this.removeQuickCreateChildBtn()
      } else {
        const { isActive } = this.getData()
        if (isActive) {
          this.showQuickCreateChildBtn()
        } else {
          this.hideQuickCreateChildBtn()
        }
      }
    }
    // 更新拖拽手柄的显示与否
    this.updateDragHandle()
    // 更新概要
    this.renderGeneralization(forceRender)
    // 更新协同头像
    if (this.updateUserListNode) this.updateUserListNode()
    // 更新节点位置
    const t = this.group.transform()
    // 保存一份当前节点数据快照
    this.nodeDataSnapshot = readonly ? '' : JSON.stringify(this.getData())
    // 节点位置变化才更新，因为即使值没有变化属性设置操作也是耗时的
    if (this.left !== t.translateX || this.top !== t.translateY) {
      this.group.translate(this.left - t.translateX, this.top - t.translateY)
    }
  }

  // 获取节点相当于画布的位置
  getNodePosInClient(_left, _top) {
    const drawTransform = this.mindMap.draw.transform()
    const { scaleX, scaleY, translateX, translateY } = drawTransform
    const left = _left * scaleX + translateX
    const top = _top * scaleY + translateY
    return {
      left,
      top
    }
  }

  // 判断节点是否可见
  checkIsInClient(padding = 0) {
    const { left: nx, top: ny } = this.getNodePosInClient(this.left, this.top)
    return (
      nx + this.width > 0 - padding &&
      ny + this.height > 0 - padding &&
      nx < this.mindMap.width + padding &&
      ny < this.mindMap.height + padding
    )
  }

  // 重新渲染节点，即重新创建节点内容、计算节点大小、计算节点内容布局、更新展开收起按钮，概要及位置
  reRender(recreateTypes, opt) {
    const sizeChange = this.getSize(recreateTypes, opt)
    this.layout()
    this.update()
    return sizeChange
  }

  // 更新节点激活状态
  updateNodeActiveClass() {
    if (!this.group) return
    const isActive = this.getData('isActive')
    this.group[isActive ? 'addClass' : 'removeClass']('active')
  }

  // 更新提问节点标识
  updateQuestionNodeClass() {
    if (!this.group) return
    const isQuestion = this.getData('isQuestion')
    if (isQuestion) {
      this.group.attr('data-is-question', 'true')
    } else {
      this.group.attr('data-is-question', null)
    }
  }

  // 根据是否激活更新节点
  updateNodeByActive(active) {
    if (this.group) {
      const { isShowCreateChildBtnIcon } = this.mindMap.opt
      // 切换激活状态，需要切换展开收起按钮的显隐
      if (active) {
        this.showExpandBtn()
        if (isShowCreateChildBtnIcon) {
          this.showQuickCreateChildBtn()
        }
      } else {
        this.hideExpandBtn()
        if (isShowCreateChildBtnIcon) {
          this.hideQuickCreateChildBtn()
        }
      }
      this.updateNodeActiveClass()
      this.updateQuestionNodeClass()
      this.updateDragHandle()
    }
  }

  // 递归渲染
  // forceRender：强制渲染，无论是否处于画布可视区域
  // async：异步渲染
  render(callback = () => {}, forceRender = false, async = false) {
    // 节点
    // 重新渲染连线
    this.renderLine()
    const { openPerformance, performanceConfig } = this.mindMap.opt
    // 强制渲染、或没有开启性能模式、或不在画布可视区域内不渲染节点内容
    // 根节点不进行懒加载，始终渲染，因为滚动条插件依赖根节点进行计算
    if (
      forceRender ||
      !openPerformance ||
      this.checkIsInClient(performanceConfig.padding) ||
      this.isRoot
    ) {
      if (!this.group) {
        // 创建组
        this.group = new G()
        this.group.addClass('smm-node')
        this.group.css({
          cursor: 'default'
        })
        
        // 设置提问节点的标识属性
        if (this.getData('isQuestion')) {
          this.group.attr('data-is-question', 'true')
        }
        // 为文本区域设置文本光标
        this.group.on('mouseover', (e) => {
          const target = e.target
          if (target.tagName === 'text' || target.tagName === 'tspan' || 
              target.closest('.smm-text-node-wrap') || 
              target.closest('foreignObject')) {
            this.group.css({ cursor: 'text' })
          } else {
            this.group.css({ cursor: 'default' })
          }
        })
        this.bindGroupEvent()
        this.nodeDraw.add(this.group)
        this.layout()
        this.update(forceRender)
      } else {
        if (!this.nodeDraw.has(this.group)) {
          this.nodeDraw.add(this.group)
        }
        if (this.needLayout) {
          this.needLayout = false
          this.layout()
        }
        this.updateExpandBtnPlaceholderRect()
        this.update(forceRender)
      }
    } else if (openPerformance && performanceConfig.removeNodeWhenOutCanvas) {
      this.removeSelf()
    }
    // 子节点
    if (
      this.children &&
      this.children.length &&
      this.getData('expand') !== false
    ) {
      let index = 0
      this.children.forEach(item => {
        const renderChild = () => {
          item.render(
            () => {
              index++
              if (index >= this.children.length) {
                callback()
              }
            },
            forceRender,
            async
          )
        }
        if (async) {
          setTimeout(renderChild, 0)
        } else {
          renderChild()
        }
      })
    } else {
      callback()
    }
    // 手动插入的节点立即获得焦点并且开启编辑模式
    if (this.nodeData.inserting) {
      delete this.nodeData.inserting
      this.active()
      // setTimeout(() => {
      this.mindMap.emit('node_dblclick', this, null, true)
      // }, 0)
    }
  }

  // 删除自身，只是从画布删除，节点容器还在，后续还可以重新插回画布
  removeSelf() {
    if (!this.group) return
    this.group.remove()
    this.removeGeneralization()
  }

  //  递归删除，只是从画布删除，节点容器还在，后续还可以重新插回画布
  remove() {
    if (!this.group) return
    this.group.remove()
    this.removeGeneralization()
    this.removeLine()
    // 子节点
    if (this.children && this.children.length) {
      this.children.forEach(item => {
        item.remove()
      })
    }
  }

  // 销毁节点，不但会从画布删除，而且原节点直接置空，后续无法再插回画布
  destroy() {
    // 清理问号图标和事件监听器
    this.hideQuestionIcon()
    this.removeGlobalClickListener()
    
    this.removeLine()
    if (this.parent) {
      this.parent.removeLine()
    }
    if (!this.group) return
    if (this.emptyUser) {
      this.emptyUser()
    }
    this.resetWhenDelete()
    this.group.remove()
    this.removeGeneralization()
    this.group = null
    this.style.onRemove()
  }

  //  隐藏节点
  hide() {
    if (this.group) this.group.hide()
    this.hideGeneralization()
    if (this.parent) {
      const index = this.parent.children.indexOf(this)
      this.parent._lines[index] && this.parent._lines[index].hide()
      this._lines.forEach(item => {
        item.hide()
      })
    }
    // 子节点
    if (this.children && this.children.length) {
      this.children.forEach(item => {
        item.hide()
      })
    }
  }

  //  显示节点
  show() {
    if (!this.group) {
      return
    }
    this.group.show()
    this.showGeneralization()
    if (this.parent) {
      const index = this.parent.children.indexOf(this)
      this.parent._lines[index] && this.parent._lines[index].show()
      this._lines.forEach(item => {
        item.show()
      })
    }
    // 子节点
    if (this.children && this.children.length) {
      this.children.forEach(item => {
        item.show()
      })
    }
  }

  // 设置节点透明度
  // 包括连接线和下级节点
  setOpacity(val) {
    // 自身及连线
    if (this.group) this.group.opacity(val)
    this._lines.forEach(line => {
      line.opacity(val)
    })
    // 子节点
    this.children.forEach(item => {
      item.setOpacity(val)
    })
    // 概要节点
    this.setGeneralizationOpacity(val)
  }

  // 隐藏子节点
  hideChildren() {
    this._lines.forEach(item => {
      item.hide()
    })
    if (this.children && this.children.length) {
      this.children.forEach(item => {
        item.hide()
      })
    }
  }

  // 显示子节点
  showChildren() {
    this._lines.forEach(item => {
      item.show()
    })
    if (this.children && this.children.length) {
      this.children.forEach(item => {
        item.show()
      })
    }
  }

  // 被拖拽中
  startDrag() {
    this.isDrag = true
    if (this.group) this.group.addClass('smm-node-dragging')
  }

  // 拖拽结束
  endDrag() {
    this.isDrag = false
    if (this.group) this.group.removeClass('smm-node-dragging')
  }

  //  连线
  renderLine(deep = false) {
    if (this.getData('expand') === false) {
      return
    }
    let childrenLen = this.getChildrenLength()
    // 切换为鱼骨结构时，清空根节点和二级节点的连线
    if (this.mindMap.renderer.layout.nodeIsRemoveAllLines) {
      if (this.mindMap.renderer.layout.nodeIsRemoveAllLines(this)) {
        childrenLen = 0
      }
    }
    if (childrenLen > this._lines.length) {
      // 创建缺少的线
      new Array(childrenLen - this._lines.length).fill(0).forEach(() => {
        this._lines.push(this.lineDraw.path())
      })
    } else if (childrenLen < this._lines.length) {
      // 删除多余的线
      this._lines.slice(childrenLen).forEach(line => {
        line.remove()
      })
      this._lines = this._lines.slice(0, childrenLen)
    }
    // 画线
    this.renderer.layout.renderLine(
      this,
      this._lines,
      (...args) => {
        // 添加样式
        this.styleLine(...args)
      },
      this.style.getStyle('lineStyle', true)
    )
    // 子级的连线也需要更新
    if (deep && this.children && this.children.length > 0) {
      this.children.forEach(item => {
        item.renderLine(deep)
      })
    }
  }

  //  获取节点形状
  getShape() {
    // 节点使用功能横线风格的话不支持设置形状，直接使用默认的矩形
    return this.mindMap.themeConfig.nodeUseLineStyle
      ? CONSTANTS.SHAPE.RECTANGLE
      : this.style.getStyle('shape', false, false)
  }

  //  检查节点是否存在自定义数据
  hasCustomPosition() {
    return this.customLeft !== undefined && this.customTop !== undefined
  }

  //  检查节点是否存在自定义位置的祖先节点，包含自身
  ancestorHasCustomPosition() {
    let node = this
    while (node) {
      if (node.hasCustomPosition()) {
        return true
      }
      node = node.parent
    }
    return false
  }

  //  检查是否存在有概要的祖先节点
  ancestorHasGeneralization() {
    let node = this.parent
    while (node) {
      if (node.checkHasGeneralization()) {
        return true
      }
      node = node.parent
    }
    return false
  }

  //  添加子节点
  addChildren(node) {
    this.children.push(node)
  }

  //  设置连线样式
  styleLine(line, childNode, enableMarker) {
    const { enableInheritAncestorLineStyle } = this.mindMap.opt
    const getName = enableInheritAncestorLineStyle
      ? 'getSelfInhertStyle'
      : 'getSelfStyle'
    const width =
      childNode[getName]('lineWidth') || childNode.getStyle('lineWidth', true)
    const color =
      childNode[getName]('lineColor') ||
      this.getRainbowLineColor(childNode) ||
      childNode.getStyle('lineColor', true)
    const dasharray =
      childNode[getName]('lineDasharray') ||
      childNode.getStyle('lineDasharray', true)
    this.style.line(
      line,
      {
        width,
        color,
        dasharray
      },
      enableMarker,
      childNode
    )
  }

  // 获取彩虹线条颜色
  getRainbowLineColor(node) {
    return this.mindMap.rainbowLines
      ? this.mindMap.rainbowLines.getNodeColor(node)
      : ''
  }

  //  移除连线
  removeLine() {
    this._lines.forEach(line => {
      line.remove()
    })
    this._lines = []
  }

  //  检测当前节点是否是某个节点的祖先节点
  isAncestor(node) {
    if (this.uid === node.uid) {
      return false
    }
    let parent = node.parent
    while (parent) {
      if (this.uid === parent.uid) {
        return true
      }
      parent = parent.parent
    }
    return false
  }

  // 检查当前节点是否是某个节点的父节点
  isParent(node) {
    if (this.uid === node.uid) {
      return false
    }
    const parent = node.parent
    if (parent && this.uid === parent.uid) {
      return true
    }
    return false
  }

  //  检测当前节点是否是某个节点的兄弟节点
  isBrother(node) {
    if (!this.parent || this.uid === node.uid) {
      return false
    }
    return this.parent.children.find(item => {
      return item.uid === node.uid
    })
  }

  // 获取该节点在兄弟节点列表中的索引
  getIndexInBrothers() {
    return this.parent && this.parent.children
      ? this.parent.children.findIndex(item => {
          return item.uid === this.uid
        })
      : -1
  }

  //  获取padding值
  getPaddingVale() {
    return {
      paddingX: this.getStyle('paddingX'),
      paddingY: this.getStyle('paddingY')
    }
  }

  //  获取某个样式
  getStyle(prop, root) {
    const v = this.style.merge(prop, root)
    return v === undefined ? '' : v
  }

  //  获取自定义样式
  getSelfStyle(prop) {
    return this.style.getSelfStyle(prop)
  }

  //   获取最近一个存在自身自定义样式的祖先节点的自定义样式
  getParentSelfStyle(prop) {
    if (this.parent) {
      return (
        this.parent.getSelfStyle(prop) || this.parent.getParentSelfStyle(prop)
      )
    }
    return null
  }

  //  获取自身可继承的自定义样式
  getSelfInhertStyle(prop) {
    return (
      this.getSelfStyle(prop) || // 自身
      this.getParentSelfStyle(prop)
    ) // 父级
  }

  // 获取节点非节点状态的边框大小
  getBorderWidth() {
    return this.style.merge('borderWidth', false) || 0
  }

  //  获取数据
  getData(key) {
    return key ? this.nodeData.data[key] : this.nodeData.data
  }

  // 获取该节点的纯数据，即不包含对节点实例的引用
  getPureData(removeActiveState = true, removeId = false) {
    return copyNodeTree({}, this, removeActiveState, removeId)
  }

  // 获取祖先节点列表
  getAncestorNodes() {
    const list = []
    let parent = this.parent
    while (parent) {
      list.unshift(parent)
      parent = parent.parent
    }
    return list
  }

  // 是否存在自定义样式
  hasCustomStyle() {
    return this.style.hasCustomStyle()
  }

  // 获取节点的尺寸和位置信息，宽高是应用了缩放效果后的实际宽高，位置是相对于浏览器窗口左上角的位置
  getRect() {
    return this.group ? this.group.rbox() : null
  }

  // 获取节点的尺寸和位置信息，宽高是应用了缩放效果后的实际宽高，位置信息相对于画布
  getRectInSvg() {
    const { scaleX, scaleY, translateX, translateY } =
      this.mindMap.draw.transform()
    let { left, top, width, height } = this
    const right = (left + width) * scaleX + translateX
    const bottom = (top + height) * scaleY + translateY
    left = left * scaleX + translateX
    top = top * scaleY + translateY
    return {
      left,
      right,
      top,
      bottom,
      width: width * scaleX,
      height: height * scaleY
    }
  }

  // 高亮节点
  highlight() {
    if (this.group) this.group.addClass('smm-node-highlight')
  }

  // 取消高亮节点
  closeHighlight() {
    if (this.group) this.group.removeClass('smm-node-highlight')
  }

  // 伪克隆节点
  // 克隆出的节点并不能真正当做一个节点使用
  fakeClone() {
    const newNode = new MindMapNode({
      ...this.opt,
      uid: createUid()
    })
    Object.keys(this).forEach(item => {
      newNode[item] = this[item]
    })
    return newNode
  }

  // 创建SVG文本节点
  createSvgTextNode(text = '') {
    return new Text().text(text)
  }

  // 获取SVG.js库的一些对象
  getSvgObjects() {
    return {
      SVG,
      G,
      Rect
    }
  }

  // 检查是否支持拖拽调整宽度
  // 1.富文本模式
  // 2.自定义节点内容
  checkEnableDragModifyNodeWidth() {
    const {
      enableDragModifyNodeWidth,
      isUseCustomNodeContent,
      customCreateNodeContent
    } = this.mindMap.opt
    return (
      enableDragModifyNodeWidth &&
      (this.mindMap.richText ||
        (isUseCustomNodeContent && customCreateNodeContent))
    )
  }

  // 是否存在自定义宽度
  hasCustomWidth() {
    return (
      this.checkEnableDragModifyNodeWidth() &&
      this.customTextWidth !== undefined
    )
  }

  // 获取子节点的数量
  getChildrenLength() {
    return this.nodeData.children ? this.nodeData.children.length : 0
  }
}

export default MindMapNode
