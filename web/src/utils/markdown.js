/**
 * Markdown 渲染工具
 * 基于 marked v4 + highlight.js，全局配置语法高亮
 */
const { marked } = require('marked/lib/marked.cjs')
const hljs = require('highlight.js')

// 配置 marked 全局选项，启用语法高亮
marked.setOptions({
  highlight: function (code, lang) {
    // 策略：
    // 1. 优先用指定语言高亮
    // 2. 如果指定语言高亮结果没有 <span>（即高亮实际失败），回退到 auto
    //    例如 hljs cpp 模式对模板密集代码（typename... Args）会静默失败
    if (lang && hljs.getLanguage(lang)) {
      try {
        const result = hljs.highlight(code, { language: lang }).value
        if (/<span/.test(result)) {
          return result
        }
        // 指定语言虽然存在但没生成高亮（如 cpp 模板代码）→ 走 auto
      } catch (e) {
        // 异常也回退到 auto
      }
    }
    try {
      return hljs.highlightAuto(code).value
    } catch (e) {
      // 彻底失败时返回转义后的纯文本
      return code
    }
  }
})

module.exports = marked
