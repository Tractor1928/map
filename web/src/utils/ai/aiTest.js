/**
 * AI服务测试工具
 * 提供完整的AI服务功能测试和调试支持
 */

import { aiServiceFactory } from '@/services/ai'

/**
 * 测试AI服务连接
 * @returns {Promise<Object>} 连接测试结果
 */
async function testAIConnection() {
  try {
    console.log('🌐 测试AI服务连接...')
    
    // 检查localStorage配置
    const apiKey = localStorage.getItem('apiKey')
    const model = localStorage.getItem('model')
    
    console.log('📋 当前配置状态:')
    console.log(`  - API Key: ${apiKey ? '✅ 已配置' : '❌ 未配置'}`)
    console.log(`  - 模型: ${model || '❌ 未配置'}`)
    
    if (!apiKey) {
      return {
        success: false,
        message: '请先在localStorage中配置 API Key:\nlocalStorage.setItem(\'apiKey\', \'your-api-key\')'
      }
    }
    
    if (!model) {
      return {
        success: false,
        message: '请先在localStorage中配置模型:\nlocalStorage.setItem(\'model\', \'gpt-3.5-turbo\')'
      }
    }
    
    const aiService = aiServiceFactory.createService()
    const result = await aiService.testConnection()
    
    console.log('🔍 连接测试结果:', result)
    return result
  } catch (error) {
    console.error('❌ 连接测试异常:', error)
    return {
      success: false,
      message: error.message || '连接测试失败'
    }
  }
}

/**
 * 检查localStorage配置
 * @returns {Object} 配置检查结果
 */
function checkLocalStorageConfig() {
  const apiKey = localStorage.getItem('apiKey')
  const model = localStorage.getItem('model')
  
  console.log('🔍 检查localStorage配置...')
  console.log(`📝 API Key: ${apiKey ? '已配置 (' + apiKey.substring(0, 10) + '...)' : '未配置'}`)
  console.log(`🎯 模型: ${model || '未配置'}`)
  
  return {
    hasApiKey: Boolean(apiKey),
    hasModel: Boolean(model),
    apiKey: apiKey ? apiKey.substring(0, 10) + '...' : null,
    model: model || null
  }
}

/**
 * 设置localStorage配置（仅用于测试）
 * @param {string} apiKey - API密钥  
 * @param {string} model - 模型名称
 */
function setTestConfig(apiKey, model = 'gpt-3.5-turbo') {
  console.log('⚙️ 设置测试配置...')
  localStorage.setItem('apiKey', apiKey)
  localStorage.setItem('model', model)
  console.log('✅ 配置已设置:', { apiKey: apiKey.substring(0, 10) + '...', model })
}

/**
 * 测试AI回答生成
 * @param {string} testMessage - 测试消息
 * @returns {Promise<Object>} 生成测试结果
 */
async function testAIResponseGeneration(testMessage = '你好，请简单介绍一下你自己') {
  try {
    console.log('🧪 测试AI回答生成...')
    console.log('📝 测试消息:', testMessage)
    
    const aiService = aiServiceFactory.createService()
    const messages = [
      { role: 'user', content: testMessage }
    ]
    
    const startTime = Date.now()
    const response = await aiService.generateResponse(messages)
    const endTime = Date.now()
    
    console.log('✅ AI回答生成成功')
    console.log('💬 回答内容:', response.substring(0, 100) + (response.length > 100 ? '...' : ''))
    console.log('⏱️ 耗时:', endTime - startTime, 'ms')
    
    return {
      success: true,
      response,
      responseTime: endTime - startTime,
      messageLength: response.length
    }
  } catch (error) {
    console.error('❌ AI回答生成失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 测试流式响应
 * @param {string} testMessage - 测试消息
 * @returns {Promise<Object>} 流式测试结果
 */
async function testStreamResponse(testMessage = '请详细介绍一下JavaScript的发展历史') {
  try {
    console.log('🌊 测试流式响应...')
    console.log('📝 测试消息:', testMessage)
    
    const aiService = aiServiceFactory.createService()
    const messages = [
      { role: 'user', content: testMessage }
    ]
    
    let chunks = []
    let fullResponse = ''
    const startTime = Date.now()
    
    const response = await aiService.generateResponse(messages, (content) => {
      chunks.push(content)
      fullResponse += content
      console.log('📦 收到流式内容块:', content.length, '字符')
    })
    
    const endTime = Date.now()
    
    console.log('✅ 流式响应测试完成')
    console.log('📊 统计信息:')
    console.log(`  - 总块数: ${chunks.length}`)
    console.log(`  - 总字符数: ${fullResponse.length}`)
    console.log(`  - 耗时: ${endTime - startTime}ms`)
    
    return {
      success: true,
      chunks: chunks.length,
      totalLength: fullResponse.length,
      responseTime: endTime - startTime,
      response: fullResponse
    }
  } catch (error) {
    console.error('❌ 流式响应测试失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * 运行完整AI服务测试套件
 * @returns {Promise<Object>} 测试结果
 */
async function runAITestSuite() {
  console.log('🚀 开始AI服务完整测试...')
  
  const results = {
    basicTests: {},
    connectionTest: {},
    configCheck: {}
  }
  
  try {
    // 1. 配置检查
    console.log('🧪 检查localStorage配置...')
    results.configCheck = checkLocalStorageConfig()
    
    // 2. 基础功能测试
    console.log('🧪 测试AI服务工厂实例化...')
    const factory = aiServiceFactory
    results.basicTests.factoryInstance = factory ? '✅ 成功' : '❌ 失败'
    
    console.log('🧪 测试AI服务实例获取...')
    try {
      const service = factory.createService()
      results.basicTests.serviceInstance = service ? '✅ 成功' : '❌ 失败'
      
      console.log('🧪 测试服务配置获取...')
      const config = service.getConfig()
      results.basicTests.serviceConfig = config ? 
        `✅ 成功 - 服务类型: ${config.type}, 名称: ${config.name}` : 
        '❌ 失败'
      
      console.log('🧪 测试可用服务模式列表...')
      const modes = factory.getAvailableModes()
      results.basicTests.availableModes = modes.length > 0 ? 
        `✅ 成功 - 可用模式: ${modes.map(m => m.name).join(', ')}` : 
        '❌ 失败'
    } catch (error) {
      results.basicTests.serviceInstance = `❌ 失败: ${error.message}`
      results.basicTests.serviceConfig = '❌ 跳过（服务实例创建失败）'
      results.basicTests.availableModes = '❌ 跳过（服务实例创建失败）'
    }
    
    // 3. 连接测试  
    console.log('🌐 测试AI服务连接...')
    results.connectionTest = await testAIConnection()
    
  } catch (error) {
    console.error('💥 测试套件执行失败:', error)
    results.error = error.message
  }
  
  // 计算总体结果
  const basicPassed = Object.values(results.basicTests).every(result => 
    typeof result === 'string' && result.includes('✅')
  )
  const connectionPassed = results.connectionTest.success === true
  
  console.log(`📊 AI服务测试完成: 基础功能: ${basicPassed ? '✅ 通过' : '❌ 失败'}, 连接测试: ${connectionPassed ? '✅ 通过' : '❌ 失败'}`)
  
  return {
    ...results,
    summary: {
      basicTests: basicPassed,
      connectionTest: connectionPassed,
      overall: basicPassed && connectionPassed
    }
  }
}

/**
 * 显示测试结果
 * @param {Object} results - 测试结果对象
 */
function displayTestResults(results) {
  console.log('🔍 AI服务测试结果详情')
  
  // 配置检查结果
  console.log('\n📋 配置检查')
  console.log(`API Key: ${results.configCheck.hasApiKey ? '✅ 已配置' : '❌ 未配置'}`)
  console.log(`模型: ${results.configCheck.hasModel ? '✅ 已配置 (' + results.configCheck.model + ')' : '❌ 未配置'}`)
  
  if (!results.configCheck.hasApiKey || !results.configCheck.hasModel) {
    console.log('\n💡 配置建议:')
    if (!results.configCheck.hasApiKey) {
      console.log('localStorage.setItem(\'apiKey\', \'your-openai-api-key\')')
    }
    if (!results.configCheck.hasModel) {
      console.log('localStorage.setItem(\'model\', \'gpt-3.5-turbo\')')
    }
  }
  
  // 基础功能测试结果
  console.log('\n📋 基础功能测试')
  Object.entries(results.basicTests).forEach(([key, result]) => {
    console.log(`${result}`)
  })
  
  // 连接测试结果
  console.log('\n🌐 连接测试')
  console.log(`${results.connectionTest.success ? '✅' : '❌'} 连接状态: ${results.connectionTest.message || (results.connectionTest.success ? '连接成功' : '连接失败')}`)
  
  // 总体结果
  const { basicTests, connectionTest, overall } = results.summary
  console.log(`\n📊 总体结果: 基础功能: ${basicTests ? '✅ 通过' : '❌ 失败'}, 连接测试: ${connectionTest ? '✅ 通过' : '❌ 失败'}`)
  
  if (overall) {
    console.log('🎉 所有测试通过！AI服务可以正常使用')
  } else {
    console.log('⚠️ 部分测试失败，请检查配置和网络连接')
  }
}

// 为了调试方便，将测试函数挂载到window对象
if (typeof window !== 'undefined') {
  window.aiTestUtils = {
    testAIConnection,
    checkLocalStorageConfig,
    setTestConfig,
    testAIResponseGeneration,
    testStreamResponse,
    runAITestSuite,
    displayTestResults
  }
  
  console.log('🛠️ AI测试工具已加载到 window.aiTestUtils')
  console.log('💡 使用 window.aiTestUtils.runAITestSuite().then(window.aiTestUtils.displayTestResults) 运行完整测试')
}

// 导出测试工具
export {
  testAIConnection,
  checkLocalStorageConfig,
  setTestConfig,
  testAIResponseGeneration,
  testStreamResponse,
  runAITestSuite,
  displayTestResults
} 