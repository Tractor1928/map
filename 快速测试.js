// 快速测试简化后的AI生成逻辑
console.log('🚀 [快速测试] 开始测试简化后的AI生成逻辑');

// 检查必要组件
if (typeof window.mindMapInstance === 'undefined') {
    console.error('❌ [测试] 未找到mindMapInstance');
} else {
    console.log('✅ [测试] 找到思维导图实例');
    
    // 监听相关事件
    const events = ['node_text_edit_end', 'data_change'];
    events.forEach(eventName => {
        window.mindMapInstance.on(eventName, (...args) => {
            if (eventName === 'node_text_edit_end') {
                console.log(`🎯 [事件] ${eventName} 触发，参数:`, args);
            }
        });
    });
    
    // 创建测试函数
    window.quickTestAI = function() {
        console.log('🧪 [快速测试] 开始模拟编辑和AI生成...');
        
        const rootNode = window.mindMapInstance.renderer.root;
        console.log('📝 [快速测试] 根节点:', rootNode);
        
        // 手动触发node_text_edit_end事件
        const testQuestion = '什么是React？';
        console.log('🎯 [快速测试] 手动触发事件，测试问题:', testQuestion);
        
        window.mindMapInstance.emit('node_text_edit_end', rootNode, testQuestion, '');
        
        console.log('⏱️ [快速测试] 等待AI节点生成...');
        
        // 检查结果
        setTimeout(() => {
            if (rootNode.children && rootNode.children.length > 0) {
                const aiNodes = rootNode.children.filter(child => child.getData('isAIResponse'));
                console.log('🎉 [测试结果] AI节点数量:', aiNodes.length);
                if (aiNodes.length > 0) {
                    console.log('✅ [测试成功] 生成了AI回答节点');
                    aiNodes.forEach((node, index) => {
                        console.log(`📋 [AI节点${index + 1}]`, {
                            text: node.getData('text'),
                            uid: node.getData('uid') || node.uid,
                            isAIResponse: node.getData('isAIResponse')
                        });
                    });
                } else {
                    console.log('❌ [测试失败] 未生成AI回答节点');
                }
            } else {
                console.log('❌ [测试失败] 根节点没有子节点');
            }
        }, 2000);
    };
    
    console.log(`
📋 [快速测试] 使用说明：
1. 运行 window.quickTestAI() 进行自动化测试
2. 或者手动双击节点，输入问题，观察是否生成AI回答
3. 现在的逻辑：只要编辑完成且文本不为空就生成AI回答

🎯 [期待结果]：
- 双击节点编辑后应该直接生成AI回答子节点
- 不再判断文本是否变化
- 只要不是AI节点本身，都会生成回答
    `);
} 