// AI功能调试脚本
// 在浏览器控制台运行此脚本来诊断问题

console.log('🔧 [调试脚本] 开始AI功能诊断...')

// 1. 检查基础依赖
console.log('📋 [检查] 1. 基础依赖检查')
console.log('- window.mindMapInstance:', typeof window.mindMapInstance)
console.log('- window.aiTestUtils:', typeof window.aiTestUtils)
console.log('- window.aiServiceFactory:', typeof window.aiServiceFactory)
console.log('- window.testAIResponse:', typeof window.testAIResponse)

// 2. 检查思维导图实例
if (window.mindMapInstance) {
    console.log('📋 [检查] 2. 思维导图实例检查')
    console.log('- mindMap.renderer:', !!window.mindMapInstance.renderer)
    console.log('- mindMap.execCommand:', typeof window.mindMapInstance.execCommand)
    console.log('- mindMap.on:', typeof window.mindMapInstance.on)
    console.log('- activeNodeList:', window.mindMapInstance.renderer?.activeNodeList?.length || 0)
} else {
    console.warn('❌ mindMap实例未找到')
}

// 3. 测试AI服务
console.log('📋 [检查] 3. AI服务检查')
if (window.aiServiceFactory) {
    try {
        const service = window.aiServiceFactory.getService()
        console.log('- AI服务获取成功:', !!service)
        console.log('- 服务类型:', service?.constructor?.name)
    } catch (error) {
        console.error('- AI服务获取失败:', error)
    }
} else {
    console.warn('❌ aiServiceFactory未找到')
}

// 4. 模拟事件测试
function testEventTrigger() {
    console.log('🧪 [测试] 4. 模拟事件触发测试')
    
    if (!window.mindMapInstance) {
        console.warn('❌ 无法测试：mindMap实例不存在')
        return
    }
    
    // 创建一个测试节点
    const rootNode = window.mindMapInstance.renderer.root
    if (!rootNode) {
        console.warn('❌ 无法获取根节点')
        return
    }
    
    console.log('- 根节点:', rootNode)
    
    // 手动触发事件
    const testText = '什么是人工智能？'
    console.log('- 测试文本:', testText)
    
    // 模拟节点编辑完成事件
    setTimeout(() => {
        console.log('🔥 [触发] 手动触发node_text_edit_end事件')
        window.mindMapInstance.emit('node_text_edit_end', rootNode, testText, '')
    }, 1000)
}

// 5. 运行所有测试
async function runFullDiagnosis() {
    console.log('🏁 [诊断] 开始完整诊断流程')
    
    // 基础检查
    const hasBasics = window.mindMapInstance && window.aiServiceFactory
    console.log('- 基础组件:', hasBasics ? '✅' : '❌')
    
    if (!hasBasics) {
        console.error('❌ 基础组件缺失，无法继续诊断')
        return
    }
    
    // 事件测试
    testEventTrigger()
    
    // AI服务测试
    if (window.aiTestUtils) {
        console.log('🧪 [测试] 运行AI服务测试...')
        try {
            await window.aiTestUtils.testAIServiceBasic()
        } catch (error) {
            console.error('❌ AI服务测试失败:', error)
        }
    }
}

// 导出到全局作用域
window.aiDebugScript = {
    runFullDiagnosis,
    testEventTrigger
}

console.log('🔧 [调试脚本] 诊断脚本加载完成')
console.log('💡 [使用方法] 在控制台运行: window.aiDebugScript.runFullDiagnosis()') 