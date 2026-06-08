/**
 * 节点内容分段工具
 *
 * 将节点文本（尤其是 AI 回答的长 Markdown 内容）语义化拆分成多个段落，
 * 用于移动端逐段阅读体验。移动端每次只显示一个段落。
 *
 * 分段策略（优先级从高到低）：
 * 1. H2 标题 `## ` — 每个 ## 标题作为段落边界，标题作为段落 title
 * 2. H3 标题 `### ` — 在 H2 段过长时（> 800 字符）进一步拆分
 * 3. 空行分隔 — 双换行符 `\n\n` 作为段落边界
 * 4. 固定长度兜底 — 超过 1000 字符的纯文本按 500 字符强行分段
 *
 * 特殊处理：
 * - 代码块 ` ```...``` ` 保持完整，不从中拆分
 * - Mermaid 图表块保持完整
 * - 表格保持完整
 */

/**
 * 提取代码块占位，保护代码块不被拆分
 * @param {string} text
 * @returns {{ processed: string, blocks: string[] }}
 */
function protectCodeBlocks(text) {
  const blocks = []
  let processed = text
  // 保护围栏代码块 ```
  processed = processed.replace(/```[\w]*\n?[\s\S]*?```/g, (match) => {
    blocks.push(match)
    return `__CODE_BLOCK_${blocks.length - 1}__`
  })
  // 保护行内代码（不在代码块内的）
  // 不做行内保护，因为行内代码一般很短
  return { processed, blocks }
}

/**
 * 还原代码块
 * @param {string} text
 * @param {string[]} blocks
 * @returns {string}
 */
function restoreCodeBlocks(text, blocks) {
  return text.replace(/__CODE_BLOCK_(\d+)__/g, (_, i) => blocks[parseInt(i)] || '')
}

/**
 * 判断内容是否包含 Markdown 标题（H1-H6）
 * @param {string} text
 * @returns {boolean}
 */
function hasHeadings(text) {
  return /^#{1,6}\s+.+$/m.test(text)
}

/**
 * 判断内容是否包含 H2 标题
 * @param {string} text
 * @returns {boolean}
 */
function hasH2Headings(text) {
  return /^##\s+.+$/m.test(text)
}

/**
 * 判断内容是否包含 H3 标题
 * @param {string} text
 * @returns {boolean}
 */
function hasH3Headings(text) {
  return /^###\s+.+$/m.test(text)
}

/**
 * 按 H2 标题拆分段落
 * @param {string} text - 已保护代码块的文本
 * @returns {Array<{ title: string, content: string }>}
 */
function splitByH2(text) {
  const segments = []
  // 匹配 H2 标题行 —— 注意：只匹配行首的 ## ，不匹配行中间的
  const h2Pattern = /^## (.+)$/gm
  const matches = []
  let match
  while ((match = h2Pattern.exec(text)) !== null) {
    matches.push({ title: match[1].trim(), index: match.index, endIndex: match.index + match[0].length })
  }

  if (matches.length === 0) {
    // 没有 H2 标题，整体作为一个段落
    const trimmed = text.trim()
    if (trimmed) {
      segments.push({ title: '', content: trimmed })
    }
    return segments
  }

  // 处理第一个标题前的内容（如果有）
  if (matches[0].index > 0) {
    const beforeFirst = text.substring(0, matches[0].index).trim()
    if (beforeFirst) {
      segments.push({ title: '', content: beforeFirst })
    }
  }

  // 按标题拆分
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]
    const nextIndex = i < matches.length - 1 ? matches[i + 1].index : text.length
    const content = text.substring(current.endIndex, nextIndex).trim()
    if (content || i === matches.length - 1) {
      segments.push({ title: current.title, content })
    }
  }

  return segments
}

/**
 * 对单个段落进一步按 H3 标题拆分
 * @param {string} title
 * @param {string} content
 * @returns {Array<{ title: string, content: string }>}
 */
function splitByH3(title, content) {
  const segments = []
  const h3Pattern = /^### (.+)$/gm
  const matches = []
  let match
  while ((match = h3Pattern.exec(content)) !== null) {
    matches.push({ title: match[1].trim(), index: match.index, endIndex: match.index + match[0].length })
  }

  if (matches.length === 0) {
    segments.push({ title, content })
    return segments
  }

  // 第一个 H3 前的内容
  if (matches[0].index > 0) {
    const beforeFirst = content.substring(0, matches[0].index).trim()
    if (beforeFirst) {
      segments.push({ title, content: beforeFirst })
    }
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]
    const nextIndex = i < matches.length - 1 ? matches[i + 1].index : content.length
    const segContent = content.substring(current.endIndex, nextIndex).trim()
    if (segContent || i === matches.length - 1) {
      segments.push({ title: current.title, content: segContent })
    }
  }

  return segments
}

/**
 * 按空行拆分段落
 * @param {string} title
 * @param {string} content
 * @returns {Array<{ title: string, content: string }>}
 */
function splitByParagraph(title, content) {
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
  if (paragraphs.length <= 1) {
    return [{ title, content }]
  }
  return paragraphs.map((p, i) => ({
    title: i === 0 ? title : '',
    content: p.trim()
  }))
}

/**
 * 按固定长度强制拆分
 * @param {string} title
 * @param {string} content
 * @param {number} maxLen
 * @returns {Array<{ title: string, content: string }>}
 */
function splitByLength(title, content, maxLen = 500) {
  const segments = []
  let remaining = content
  let partIndex = 0
  while (remaining.length > maxLen) {
    // 尝试在 maxLen 附近找自然断点（句号、换行）
    let splitAt = maxLen
    const searchWindow = remaining.substring(maxLen - 100, maxLen + 100)
    const breakMatch = searchWindow.match(/[。！？\n](?=[^\n]{0,50}$|[。！？\n])/)
    if (breakMatch) {
      splitAt = maxLen - 100 + searchWindow.indexOf(breakMatch[0]) + 1
    } else {
      // 在 maxLen 处找最近的空格
      const nearMax = remaining.substring(0, maxLen)
      const lastSpace = nearMax.lastIndexOf(' ')
      if (lastSpace > maxLen * 0.6) {
        splitAt = lastSpace
      }
    }
    segments.push({
      title: partIndex === 0 ? title : '',
      content: remaining.substring(0, splitAt).trim()
    })
    remaining = remaining.substring(splitAt).trim()
    partIndex++
  }
  if (remaining.trim()) {
    segments.push({
      title: partIndex === 0 ? title : '',
      content: remaining.trim()
    })
  }
  return segments
}

/**
 * 是否需要强制拆分
 * @param {string} content
 * @returns {boolean}
 */
function needsLengthSplit(content) {
  return content.length > 1000
}

/**
 * 是否需要按 H3 细分
 * @param {string} content
 * @returns {boolean}
 */
function needsH3Split(content) {
  return content.length > 800 && hasH3Headings(content)
}

/**
 * 是否短文本（不需要分段）
 * @param {string} text
 * @returns {boolean}
 */
function isShortContent(text) {
  return text.length < 200 && !hasHeadings(text)
}

/**
 * 主入口：将节点文本拆分为多个段落
 * @param {string} text - 节点原始文本（Markdown 或纯文本）
 * @returns {Array<{ title: string, content: string, index: number }>}
 */
export function splitContent(text) {
  if (!text || typeof text !== 'string') {
    return [{ title: '', content: '', index: 0 }]
  }

  const trimmed = text.trim()
  if (!trimmed) {
    return [{ title: '', content: '', index: 0 }]
  }

  // 短文本不拆分
  if (isShortContent(trimmed)) {
    return [{ title: '', content: trimmed, index: 0 }]
  }

  // 保护代码块
  const { processed, blocks } = protectCodeBlocks(trimmed)

  // 第1层：按 H2 拆分
  let rawSegments = splitByH2(processed)

  // 还原代码块
  rawSegments = rawSegments.map(seg => ({
    title: seg.title,
    content: restoreCodeBlocks(seg.content, blocks)
  }))

  // 第2层：按 H3 拆分过长的段
  let segments = []
  for (const seg of rawSegments) {
    if (needsH3Split(seg.content)) {
      segments.push(...splitByH3(seg.title, seg.content))
    } else {
      segments.push(seg)
    }
  }

  // 第3层：按空行拆分过长的段
  let finalSegments = []
  for (const seg of segments) {
    if (seg.content.length > 600) {
      finalSegments.push(...splitByParagraph(seg.title, seg.content))
    } else {
      finalSegments.push(seg)
    }
  }

  // 第4层：按固定长度强制拆分
  let result = []
  for (const seg of finalSegments) {
    if (needsLengthSplit(seg.content)) {
      result.push(...splitByLength(seg.title, seg.content))
    } else {
      result.push(seg)
    }
  }

  // 过滤空段，添加索引
  result = result
    .filter(s => s.content.trim())
    .map((s, i) => ({ ...s, index: i }))

  // 确保至少有一个段落
  if (result.length === 0) {
    result = [{ title: '', content: trimmed, index: 0 }]
  }

  return result
}

/**
 * 获取节点的段落总数
 * @param {string} text
 * @returns {number}
 */
export function getSegmentCount(text) {
  return splitContent(text).length
}

export default splitContent
