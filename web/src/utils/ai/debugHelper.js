/**
 * AI功能调试助手
 * 提供详细的调试信息和测试工具
 */

class AIDebugHelper {
  constructor() {
    this.logHistory = []
    this.testResults = []
  }

  /**
   * 记录日志
   */
  log(type, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    }
    this.logHistory.push(logEntry)
    
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍'
    }
    
    console.log(`${emoji[type] || '📝'} [AI调试] ${message}`, data || '')
  }

  /**
   * 检查系统状态
   */
  checkSystemStatus() {
    this.log('info', '开始系统状态检查...')
    
    const checks = [
      {
        name: 'mindMap实例',
        check: () => typeof window.mindMapInstance === 'object' && window.mindMapInstance !== null,
        value: () => window.mindMapInstance
      },
      {
        name: 'aiServiceFactory',
        check: () => typeof window.aiServiceFactory === 'object',
        value: () => window.aiServiceFactory
      },
      {
        name: 'aiTestUtils',
        check: () => typeof window.aiTestUtils === 'object',
        value: () => window.aiTestUtils
      },
      {
        name: 'testAIResponse函数',
        check: () => typeof window.testAIResponse === 'function',
        value: () => window.testAIResponse
      }
    ]
    
    const results = {}
    checks.forEach(({ name, check, value }) => {
      const passed = check()
      results[name] = passed
      this.log(passed ? 'success' : 'error', `${name}: ${passed ? '正常' : '异常'}`, value())
    })
    
    return results
  }

  /**
   * 测试事件监听
   */
  testEventListening() {
    this.log('info', '测试事件监听机制...')
    
    if (!window.mindMapInstance) {
      this.log('error', '无法测试：mindMap实例不存在')
      return false
    }
    
    const mindMap = window.mindMapInstance
    
    // 测试事件绑定
    let eventTriggered = false
    const testHandler = () => {
      eventTriggered = true
      this.log('success', '测试事件触发成功')
    }
    
    // 绑定测试事件
    mindMap.on('test_event', testHandler)
    
    // 触发测试事件
    mindMap.emit('test_event')
    
    // 移除测试事件
    mindMap.off('test_event', testHandler)
    
    if (eventTriggered) {
      this.log('success', '事件监听机制正常')
      return true
    } else {
      this.log('error', '事件监听机制异常')
      return false
    }
  }

  /**
   * 模拟AI触发测试
   */
  simulateAITrigger(testText = '什么是人工智能？') {
    this.log('info', '模拟AI触发测试...', { testText })
    
    if (!window.mindMapInstance) {
      this.log('error', '无法模拟：mindMap实例不存在')
      return false
    }
    
    const mindMap = window.mindMapInstance
    const rootNode = mindMap.renderer?.root
    
    if (!rootNode) {
      this.log('error', '无法获取根节点')
      return false
    }
    
    this.log('debug', '根节点信息', {
      node: rootNode,
      uid: rootNode.getData?.('uid') || rootNode.uid,
      text: rootNode.getData?.('text') || rootNode.text
    })
    
    // 手动触发节点编辑完成事件
    setTimeout(() => {
      this.log('info', '触发node_text_edit_end事件')
      mindMap.emit('node_text_edit_end', rootNode, testText, '')
    }, 100)
    
    return true
  }

  /**
   * 检查AI服务配置
   */
  checkAIServiceConfig() {
    this.log('info', '检查AI服务配置...')
    
    const config = {
      apiKey: localStorage.getItem('ai_api_key'),
      model: localStorage.getItem('ai_model'),
      mode: localStorage.getItem('ai_service_mode')
    }
    
    this.log('debug', 'AI服务配置', config)
    
    if (!config.apiKey && !config.mode) {
      this.log('warning', '未配置API Key，将使用模拟模式')
    } else if (config.apiKey) {
      this.log('success', 'API Key已配置')
    }
    
    return config
  }

  /**
   * 运行完整诊断
   */
  async runFullDiagnosis() {
    this.log('info', '🏁 开始完整诊断流程')
    
    const results = {
      systemStatus: this.checkSystemStatus(),
      eventListening: this.testEventListening(),
      aiServiceConfig: this.checkAIServiceConfig()
    }
    
    // 如果基础检查通过，进行AI触发测试
    if (results.systemStatus.mindMap实例 && results.eventListening) {
      this.log('info', '基础检查通过，进行AI触发测试...')
      results.aiTriggerTest = this.simulateAITrigger()
    } else {
      this.log('error', '基础检查未通过，跳过AI触发测试')
    }
    
    // 生成诊断报告
    this.generateDiagnosisReport(results)
    
    return results
  }

  /**
   * 生成诊断报告
   */
  generateDiagnosisReport(results) {
    this.log('info', '📊 生成诊断报告')
    
    console.group('🔍 AI功能诊断报告')
    
    console.log('📋 系统状态检查:')
    Object.entries(results.systemStatus).forEach(([name, status]) => {
      console.log(`  ${status ? '✅' : '❌'} ${name}`)
    })
    
    console.log('📡 事件监听测试:', results.eventListening ? '✅ 正常' : '❌ 异常')
    
    console.log('⚙️ AI服务配置:')
    const config = results.aiServiceConfig
    console.log(`  API Key: ${config.apiKey ? '已配置' : '未配置'}`)
    console.log(`  模型: ${config.model || '默认'}`)
    console.log(`  模式: ${config.mode || '自动'}`)
    
    if (results.aiTriggerTest !== undefined) {
      console.log('🧪 AI触发测试:', results.aiTriggerTest ? '✅ 成功' : '❌ 失败')
    }
    
    console.groupEnd()
    
    // 提供修复建议
    this.provideTroubleshootingTips(results)
  }

  /**
   * 提供问题排查建议
   */
  provideTroubleshootingTips(results) {
    console.group('💡 问题排查建议')
    
    if (!results.systemStatus.mindMap实例) {
      console.log('❌ mindMap实例未找到:')
      console.log('  - 检查Edit.vue是否正确加载')
      console.log('  - 确认思维导图组件初始化完成')
      console.log('  - 查看浏览器网络请求是否有错误')
    }
    
    if (!results.systemStatus.aiServiceFactory) {
      console.log('❌ AI服务工厂未找到:')
      console.log('  - 检查AI服务模块是否正确导入')
      console.log('  - 确认web/src/services/ai/目录文件完整')
    }
    
    if (!results.eventListening) {
      console.log('❌ 事件监听异常:')
      console.log('  - 检查aiResponseMixin是否正确引入')
      console.log('  - 确认setupAIEventListeners方法正常执行')
    }
    
    if (results.aiTriggerTest === false) {
      console.log('❌ AI触发测试失败:')
      console.log('  - 检查handleNodeTextEditEnd方法是否正确绑定')
      console.log('  - 确认智能判断算法工作正常')
      console.log('  - 查看控制台是否有详细错误信息')
    }
    
    console.log('🔧 通用排查步骤:')
    console.log('  1. 刷新页面重新加载所有模块')
    console.log('  2. 检查浏览器控制台错误信息')
    console.log('  3. 运行 window.testAIResponse("测试问题") 手动测试')
    console.log('  4. 运行 window.aiTestUtils.runAITestSuite() 进行服务测试')
    
    console.groupEnd()
  }

  /**
   * 获取日志历史
   */
  getLogHistory() {
    return this.logHistory
  }

  /**
   * 清理日志
   */
  clearLogs() {
    this.logHistory = []
    this.testResults = []
    this.log('info', '日志已清理')
  }

  /**
   * 快速测试命令
   */
  quickTest() {
    this.log('info', '⚡ 快速测试模式')
    
    // 1. 检查基础组件
    if (!window.mindMapInstance) {
      this.log('error', '缺少mindMap实例，请确保页面完全加载')
      return false
    }
    
    // 2. 尝试手动触发AI回答
    if (typeof window.testAIResponse === 'function') {
      this.log('info', '使用手动测试函数...')
      window.testAIResponse('什么是前端开发？')
      return true
    } else {
      this.log('error', '手动测试函数不可用')
      return false
    }
  }
}

// 创建全局实例
const aiDebugHelper = new AIDebugHelper()

// 挂载到window对象
if (typeof window !== 'undefined') {
  window.aiDebugHelper = aiDebugHelper
  
  // 自动运行基础检查（开发环境）
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      aiDebugHelper.log('info', '🚀 AI调试助手已就绪')
      aiDebugHelper.log('info', '💡 使用 window.aiDebugHelper.runFullDiagnosis() 进行完整诊断')
      aiDebugHelper.log('info', '💡 使用 window.aiDebugHelper.quickTest() 进行快速测试')
    }, 2000)
  }
}

export default aiDebugHelper 