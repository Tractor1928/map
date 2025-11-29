/**
 * AI 提示词配置存储工具
 * 管理提示词配置的 localStorage 存储
 */

import { PRESET_PROMPTS } from '@/config/aiPrompts'

// localStorage 键名
const STORAGE_KEYS = {
  SELECTED_PROMPT_ID: 'ai_selected_prompt_id',
  CUSTOM_PROMPTS: 'ai_custom_prompts'
}

/**
 * 获取当前选中的配置 ID
 * @returns {string} 配置 ID
 */
export function getSelectedPromptId() {
  try {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_PROMPT_ID) || 'default'
  } catch (error) {
    console.error('读取选中配置 ID 失败:', error)
    return 'default'
  }
}

/**
 * 设置选中的配置 ID
 * @param {string} id - 配置 ID
 */
export function setSelectedPromptId(id) {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_PROMPT_ID, id)
    return true
  } catch (error) {
    console.error('保存选中配置 ID 失败:', error)
    return false
  }
}

/**
 * 获取所有自定义配置
 * @returns {Array} 自定义配置列表
 */
export function getCustomPrompts() {
  try {
    const json = localStorage.getItem(STORAGE_KEYS.CUSTOM_PROMPTS)
    if (!json) return []
    return JSON.parse(json)
  } catch (error) {
    console.error('读取自定义配置失败:', error)
    return []
  }
}

/**
 * 保存或更新自定义配置
 * @param {Object} config - 配置对象 {id, name, system, contextual}
 * @returns {boolean} 是否成功
 */
export function saveCustomPrompt(config) {
  try {
    // 验证配置
    if (!config.name || !config.system || !config.contextual) {
      throw new Error('配置字段不完整')
    }
    
    const customPrompts = getCustomPrompts()
    
    // 如果没有 ID，生成新的
    if (!config.id) {
      config.id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      config.isPreset = false
      config.createdAt = new Date().toISOString()
    }
    
    // 查找是否已存在
    const existingIndex = customPrompts.findIndex(p => p.id === config.id)
    
    if (existingIndex >= 0) {
      // 更新现有配置
      customPrompts[existingIndex] = {
        ...customPrompts[existingIndex],
        ...config,
        updatedAt: new Date().toISOString()
      }
    } else {
      // 添加新配置
      customPrompts.push({
        ...config,
        createdAt: config.createdAt || new Date().toISOString()
      })
    }
    
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PROMPTS, JSON.stringify(customPrompts))
    return config.id
  } catch (error) {
    console.error('保存自定义配置失败:', error)
    return null
  }
}

/**
 * 删除自定义配置
 * @param {string} id - 配置 ID
 * @returns {boolean} 是否成功
 */
export function deleteCustomPrompt(id) {
  try {
    // 不能删除预设配置
    const isPreset = PRESET_PROMPTS.some(p => p.id === id)
    if (isPreset) {
      throw new Error('不能删除预设配置')
    }
    
    const customPrompts = getCustomPrompts()
    const filtered = customPrompts.filter(p => p.id !== id)
    
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PROMPTS, JSON.stringify(filtered))
    
    // 如果删除的是当前选中的配置，切换到默认配置
    if (getSelectedPromptId() === id) {
      setSelectedPromptId('default')
    }
    
    return true
  } catch (error) {
    console.error('删除自定义配置失败:', error)
    return false
  }
}

/**
 * 获取所有配置（预设 + 自定义）
 * @returns {Array} 所有配置列表
 */
export function getAllPrompts() {
  const customPrompts = getCustomPrompts()
  return [...PRESET_PROMPTS, ...customPrompts]
}

/**
 * 根据 ID 获取配置
 * @param {string} id - 配置 ID
 * @returns {Object|null} 配置对象
 */
export function getPromptById(id) {
  const allPrompts = getAllPrompts()
  return allPrompts.find(p => p.id === id) || null
}

/**
 * 导出配置为 JSON 字符串
 * @param {Object} config - 配置对象
 * @returns {string} JSON 字符串
 */
export function exportPromptConfig(config) {
  try {
    const exportData = {
      id: config.id,
      name: config.name,
      system: config.system,
      contextual: config.contextual,
      createdAt: config.createdAt || new Date().toISOString(),
      exportedAt: new Date().toISOString()
    }
    return JSON.stringify(exportData, null, 2)
  } catch (error) {
    console.error('导出配置失败:', error)
    return null
  }
}

/**
 * 从 JSON 字符串导入配置
 * @param {string} jsonString - JSON 字符串
 * @returns {Object} 结果对象 {success, config, error}
 */
export function importPromptConfig(jsonString) {
  try {
    const config = JSON.parse(jsonString)
    
    // 验证必要字段
    if (!config.name || !config.system || !config.contextual) {
      throw new Error('配置格式不正确，缺少必要字段')
    }
    
    // 检查 ID 是否已存在
    const allPrompts = getAllPrompts()
    const existingConfig = allPrompts.find(p => p.id === config.id)
    
    return {
      success: true,
      config: config,
      exists: !!existingConfig,
      isPreset: existingConfig?.isPreset || false
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || '解析配置文件失败'
    }
  }
}

/**
 * 下载配置为 JSON 文件
 * @param {Object} config - 配置对象
 * @param {string} filename - 文件名（可选）
 */
export function downloadPromptConfig(config, filename) {
  try {
    const jsonString = exportPromptConfig(config)
    if (!jsonString) {
      throw new Error('导出配置失败')
    }
    
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = filename || `prompt-${config.id}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    return true
  } catch (error) {
    console.error('下载配置文件失败:', error)
    return false
  }
}

/**
 * 验证配置对象
 * @param {Object} config - 配置对象
 * @returns {Object} 验证结果 {valid, errors}
 */
export function validatePromptConfig(config) {
  const errors = []
  
  if (!config) {
    errors.push('配置对象为空')
    return { valid: false, errors }
  }
  
  if (!config.name || config.name.trim() === '') {
    errors.push('配置名称不能为空')
  }
  
  if (!config.system || config.system.trim() === '') {
    errors.push('System 提示词不能为空')
  }
  
  if (!config.contextual || config.contextual.trim() === '') {
    errors.push('Contextual 提示词不能为空')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}


