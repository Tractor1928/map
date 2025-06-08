// simple-mind-map 运行时补丁
// 用于修复 node_text_edit_end 事件未触发的问题

/**
 * 为 TextEdit 类添加 node_text_edit_end 事件触发
 * @param {MindMap} mindMap - 思维导图实例
 */
function patchTextEditClass(mindMap) {
  const textEdit = mindMap.renderer.textEdit;
  
  if (!textEdit || !textEdit.hideEditTextBox) {
    console.warn('⚠️ [补丁] TextEdit实例不存在或hideEditTextBox方法未找到');
    return;
  }
  
  // 保存原始方法
  if (textEdit.__originalHideEditTextBox) {
    console.log('🔧 [补丁] TextEdit补丁已应用，跳过重复补丁');
    return;
  }
  
  textEdit.__originalHideEditTextBox = textEdit.hideEditTextBox.bind(textEdit);
  
  // 覆盖方法
  textEdit.hideEditTextBox = function() {
    console.log('🔧 [补丁] TextEdit.hideEditTextBox被调用');
    
    if (this.mindMap.richText) {
      return this.mindMap.richText.hideEditText()
    }
    if (!this.showTextEdit) {
      return
    }
    
    const currentNode = this.currentNode
    const text = this.getEditText()
    
    // 调用原始方法的逻辑
    this.currentNode = null
    this.textEditNode.style.display = 'none'
    this.textEditNode.innerHTML = ''
    this.textEditNode.style.fontFamily = 'inherit'
    this.textEditNode.style.fontSize = 'inherit'
    this.textEditNode.style.fontWeight = 'normal'
    this.textEditNode.style.transform = 'translateY(0)'
    this.setIsShowTextEdit(false)
    this.mindMap.execCommand('SET_NODE_TEXT', currentNode, text)
    this.mindMap.render()
    
    // 触发原始事件
    this.mindMap.emit(
      'hide_text_edit',
      this.textEditNode,
      this.renderer.activeNodeList,
      currentNode
    )
    
    // 🎯 添加我们需要的事件触发
    console.log('🎉 [补丁] 触发 node_text_edit_end 事件');
    this.mindMap.emit('node_text_edit_end', currentNode, text, text);
  };
  
  console.log('✅ [补丁] TextEdit 补丁应用成功');
}

/**
 * 为 RichText 插件添加 node_text_edit_end 事件触发
 * @param {MindMap} mindMap - 思维导图实例
 */
function patchRichTextPlugin(mindMap) {
  const richText = mindMap.richText;
  
  if (!richText || !richText.hideEditText) {
    console.log('ℹ️ [补丁] RichText插件未启用或方法未找到');
    return;
  }
  
  // 保存原始方法
  if (richText.__originalHideEditText) {
    console.log('🔧 [补丁] RichText补丁已应用，跳过重复补丁');
    return;
  }
  
  richText.__originalHideEditText = richText.hideEditText.bind(richText);
  
  // 覆盖方法
  richText.hideEditText = function(nodes) {
    console.log('🔧 [补丁] RichText.hideEditText被调用');
    
    if (!this.showTextEdit) {
      return
    }
    
    const { beforeHideRichTextEdit } = this.mindMap.opt
    if (typeof beforeHideRichTextEdit === 'function') {
      beforeHideRichTextEdit(this)
    }
    
    const html = this.getEditText()
    const list = nodes && nodes.length > 0 ? nodes : [this.node]
    const node = this.node
    
    // 调用原始方法的逻辑
    this.textEditNode.style.display = 'none'
    this.setIsShowTextEdit(false)
    this.mindMap.emit('rich_text_selection_change', false)
    this.node = null
    this.isInserting = false
    
    list.forEach(node => {
      this.mindMap.execCommand('SET_NODE_TEXT', node, html, true)
      this.mindMap.render()
    })
    
    // 触发原始事件
    this.mindMap.emit('hide_text_edit', this.textEditNode, list, node)
    
    // 🎯 添加我们需要的事件触发
    console.log('🎉 [补丁] RichText 触发 node_text_edit_end 事件');
    this.mindMap.emit('node_text_edit_end', node, html, html);
  };
  
  console.log('✅ [补丁] RichText 补丁应用成功');
}

/**
 * 应用所有补丁
 * @param {MindMap} mindMap - 思维导图实例
 */
export function applyMindMapPatches(mindMap) {
  console.log('🔧 [补丁系统] 开始应用 simple-mind-map 补丁');
  
  if (!mindMap) {
    console.error('❌ [补丁] mindMap实例不存在');
    return;
  }
  
  try {
    // 应用TextEdit补丁
    patchTextEditClass(mindMap);
    
    // 应用RichText补丁（如果启用）
    patchRichTextPlugin(mindMap);
    
    console.log('🎊 [补丁系统] 所有补丁应用完成');
    
    // 添加全局引用以便调试
    if (typeof window !== 'undefined') {
      window.__mindMapPatches = {
        textEditPatched: !!mindMap.renderer.textEdit.__originalHideEditTextBox,
        richTextPatched: mindMap.richText ? !!mindMap.richText.__originalHideEditText : 'N/A'
      };
      console.log('🔍 [补丁系统] 补丁状态:', window.__mindMapPatches);
    }
    
  } catch (error) {
    console.error('❌ [补丁系统] 补丁应用失败:', error);
  }
}

export default {
  applyMindMapPatches
}; 