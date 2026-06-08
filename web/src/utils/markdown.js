/**
 * Markdown 渲染工具
 * 基于 marked v4 + highlight.js，全局配置语法高亮
 */
const { marked } = require('marked/lib/marked.cjs')
const hljs = require('highlight.js')

// 配置 marked 全局选项，启用语法高亮
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (e) {
        // 指定语言高亮失败时 fallback 到自动检测
      }
    }
    try {
      return hljs.highlightAuto(code).value
    } catch (e) {
      // 最后的 fallback：返回转义后的纯文本
      return code
    }
  }
})

module.exports = marked
