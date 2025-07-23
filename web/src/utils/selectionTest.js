// 文字选择生成提问节点功能测试助手

/**
 * 文字选择测试助手
 * 提供快速测试文字选择生成提问节点功能的方法
 */
class SelectionTestHelper {
  constructor() {
    this.mindMap = null
  }

  /**
   * 初始化测试助手
   * @param {Object} mindMap - 思维导图实例
   */
  init(mindMap) {
    this.mindMap = mindMap
    console.log('🔧 [选择测试] 文字选择测试助手已初始化')
  }

  /**
   * 快速测试 - 创建包含文字的节点并模拟选择
   */
  quickTest() {
    if (!this.mindMap) {
      console.warn('🔧 [选择测试] 请先初始化mindMap实例')
      return
    }

    console.log('🧪 [选择测试] 开始快速测试...')

    try {
      // 创建测试节点
      const testText = 'Vue.js是一个渐进式JavaScript框架，用于构建用户界面'
      
      // 获取根节点
      const rootNode = this.mindMap.renderer.root
      if (!rootNode) {
        console.error('🔧 [选择测试] 无法找到根节点')
        return
      }

      // 创建子节点
      this.mindMap.execCommand('INSERT_CHILD_NODE', false, [rootNode], {
        text: testText,
        uid: 'test_node_' + Date.now()
      }, [])

      console.log('🧪 [选择测试] 测试节点已创建，请按以下步骤测试：')
      console.log('1. 在新创建的节点中选择部分文字（如"Vue.js"）')
      console.log('2. 松开鼠标，观察是否创建了提问节点')
      console.log('3. 检查是否自动生成了AI回答')

      // 延迟后自动测试
      setTimeout(() => {
        this.simulateTextSelection('Vue.js')
      }, 2000)

    } catch (error) {
      console.error('🔧 [选择测试] 快速测试失败:', error)
    }
  }

  /**
   * 模拟文字选择（用于自动化测试）
   * @param {string} selectedText - 模拟选择的文字
   */
  simulateTextSelection(selectedText) {
    console.log('🤖 [模拟测试] 模拟选择文字:', selectedText)

    try {
      // 查找包含指定文字的节点
      const targetNode = this.findNodeByText(selectedText)
      if (!targetNode) {
        console.warn('🤖 [模拟测试] 未找到包含目标文字的节点')
        return
      }

      console.log('🤖 [模拟测试] 找到目标节点，模拟显示问号图标...')
      
      // 创建一个模拟的选择范围
      const mockRange = {
        getBoundingClientRect: () => ({
          top: 100,
          left: 100,
          right: 200,
          bottom: 120,
          width: 100,
          height: 20
        })
      }
      
      // 调用显示问号图标的方法
      if (targetNode.showQuestionIcon) {
        // 在测试环境中，不传递鼠标位置参数，让其回退到文字选择结束位置
        targetNode.showQuestionIcon(selectedText, mockRange)
        
        console.log('🤖 [模拟测试] 问号图标已显示，3秒后自动点击...')
        
        // 3秒后自动点击问号图标
        setTimeout(() => {
          if (targetNode.onQuestionIconClick) {
            console.log('🤖 [模拟测试] 自动点击问号图标')
            targetNode.onQuestionIconClick()
          }
        }, 3000)
        
      } else {
        console.warn('🤖 [模拟测试] 节点不支持显示问号图标方法')
      }

    } catch (error) {
      console.error('🤖 [模拟测试] 模拟选择失败:', error)
    }
  }

  /**
   * 查找包含指定文字的节点
   * @param {string} text - 要查找的文字
   * @returns {Object|null} 找到的节点或null
   */
  findNodeByText(text) {
    if (!this.mindMap || !this.mindMap.renderer) {
      return null
    }

    const walk = (node) => {
      const nodeText = node.getData('text') || ''
      if (nodeText.includes(text)) {
        return node
      }

      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const found = walk(child)
          if (found) return found
        }
      }

      return null
    }

    return walk(this.mindMap.renderer.root)
  }

  /**
   * 显示所有节点（用于调试）
   */
  showAllNodes() {
    if (!this.mindMap || !this.mindMap.renderer) {
      console.warn('🔧 [选择测试] mindMap实例无效')
      return
    }

    console.log('📋 [节点列表] 当前所有节点:')

    const walk = (node, level = 0) => {
      const indent = '  '.repeat(level)
      const text = node.getData('text') || '空文本'
      const isQuestion = node.getData('isQuestion') ? '📝' : '📄'
      const isAI = node.getData('isAIResponse') ? '🤖' : ''
      
      console.log(`${indent}${isQuestion}${isAI} ${text}`)

      if (node.children && node.children.length > 0) {
        node.children.forEach(child => walk(child, level + 1))
      }
    }

    walk(this.mindMap.renderer.root)
  }

  /**
   * 清理测试数据
   */
  cleanup() {
    if (!this.mindMap) return

    console.log('🧹 [选择测试] 清理测试数据...')
    
    try {
      // 清空思维导图
      this.mindMap.setData({
        "data": {
          "text": "根节点"
        },
        "children": []
      })
      
      console.log('✅ [选择测试] 清理完成')
    } catch (error) {
      console.error('🔧 [选择测试] 清理失败:', error)
    }
  }

  /**
   * 显示功能使用指南
   */
  showGuide() {
    console.log('📖 [使用指南] 文字选择生成提问节点功能:')
    console.log('')
    console.log('🎯 功能说明:')
    console.log('   选中节点中的任意文字，显示问号图标，点击图标创建提问节点并生成AI回答')
    console.log('')
    console.log('🔧 使用方法:')
    console.log('   1. 在思维导图节点中用鼠标选择文字（2个字符以上）')
    console.log('   2. 松开鼠标，在选中文字旁边显示蓝色问号图标')
    console.log('   3. 点击问号图标创建提问节点')
    console.log('   4. AI自动为提问节点生成回答')
    console.log('')
    console.log('❌ 取消选择:')
    console.log('   • 点击其他地方取消选择')
    console.log('   • 按ESC键取消选择')
    console.log('   • 选择其他文字会替换当前选择')
    console.log('')
    console.log('💡 测试命令:')
    console.log('   window.selectionTest.quickTest() - 快速测试（自动演示完整流程）')
    console.log('   window.selectionTest.showAllNodes() - 显示所有节点')
    console.log('   window.selectionTest.cleanup() - 清理测试数据')
    console.log('')
    console.log('🎨 视觉效果:')
    console.log('   • 问号图标: 蓝色圆形图标，带有悬停动画')
    console.log('   • 提问节点: 蓝色虚线边框，蓝色文字')
    console.log('   • AI回答节点: 带有🤖标识')
  }
}

// 创建全局实例
const selectionTestHelper = new SelectionTestHelper()

// 导出测试助手
export default selectionTestHelper

// 在开发环境下自动挂载到window
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.selectionTest = selectionTestHelper
  console.log('🔧 [选择测试] 测试助手已挂载到 window.selectionTest')
  console.log('💡 [选择测试] 输入 window.selectionTest.showGuide() 查看使用指南')
} 