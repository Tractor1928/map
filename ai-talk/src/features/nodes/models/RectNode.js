import { DEFAULT_LAYOUT_CONFIG } from '../../layout/config/layoutConfig';

// 定义节点类型常量
const NODE_TYPES = Object.freeze({
  QUESTION: 'question',
  ANSWER: 'answer'
});

// 文本处理的最大字符数限制
const MAX_TEXT_LENGTH_FOR_CALCULATION = 1000;

// 创建一个矩形节点类
class RectNode {
  constructor(id, x, y, text = '', type = NODE_TYPES.QUESTION, config = DEFAULT_LAYOUT_CONFIG) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.text = text;
    this.type = type;
    this.parentId = null;    // 添加父节点ID
    this.childrenIds = [];   // 添加子节点ID数组
    this.level = 0;  // 添加层级属性
    
    // 使用配置参数
    this.minWidth = config.minNodeWidth;
    this.maxWidth = config.maxNodeWidth;
    this.width = config.defaultNodeWidth;
    this.height = config.defaultNodeHeight;
    this.padding = config.nodePadding;
    this.fontSize = config.nodeFontSize;
    this.fontFamily = config.nodeFontFamily;
    
    // 根据文本内容计算尺寸
    const dimensions = this.calculateDimensions(text);
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.lines = dimensions.lines;
  }

  calculateDimensions(text) {
    if (!text) return { width: this.minWidth, height: 100, lines: [''] };
    
    // 限制处理的文本长度，避免过长文本导致性能问题
    let processedText = text;
    let isTruncated = false;
    if (text.length > MAX_TEXT_LENGTH_FOR_CALCULATION) {
      processedText = text.substring(0, MAX_TEXT_LENGTH_FOR_CALCULATION);
      isTruncated = true;
    }
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${this.fontSize}px ${this.fontFamily}`;
    
    // 使用估算方法计算文本宽度，而不是精确计算每个字符
    // 对于非常长的文本，我们假设它会占满最大宽度
    let nodeWidth = this.minWidth;
    if (isTruncated) {
      nodeWidth = this.maxWidth; // 对于超长文本，直接使用最大宽度
    } else {
      // 计算文本的实际宽度
      const textWidth = context.measureText(processedText).width;
      // 根据文本宽度确定节点宽度，保持在最小和最大宽度之间
      nodeWidth = Math.min(Math.max(textWidth + (this.padding * 2), this.minWidth), this.maxWidth);
    }
    
    const maxLineWidth = nodeWidth - (this.padding * 2);
    const lines = [];
    
    // 处理文本换行 - 优化算法
    const paragraphs = processedText.split('\n');
    const approximateCharsPerLine = Math.floor(maxLineWidth / (this.fontSize * 0.6)); // 估算每行字符数
    
    for (let paragraph of paragraphs) {
      if (!paragraph.trim()) {
        lines.push('');
        continue;
      }
      
      // 简化的文本分行逻辑
      if (paragraph.length <= approximateCharsPerLine) {
        // 短段落直接添加
        lines.push(paragraph);
      } else {
        // 长段落按估算的字符数分行
        const hasEnglish = /[a-zA-Z]/.test(paragraph);
        
        if (hasEnglish) {
          // 英文按单词分行
          const words = paragraph.split(/(\s+)/);
          let currentLine = '';
          
          for (let word of words) {
            const testLine = currentLine + word;
            // 使用估算方法而不是每次都测量
            if (testLine.length <= approximateCharsPerLine) {
              currentLine = testLine;
            } else {
              if (currentLine) lines.push(currentLine.trim());
              currentLine = word;
            }
          }
          if (currentLine) lines.push(currentLine.trim());
        } else {
          // 中文按字符分行，使用估算
          for (let i = 0; i < paragraph.length; i += approximateCharsPerLine) {
            lines.push(paragraph.substring(i, i + approximateCharsPerLine));
          }
        }
      }
    }
    
    // 如果文本被截断，添加指示
    if (isTruncated) {
      lines.push('...(文本过长)');
    }

    const lineHeight = this.fontSize * 1.3;
    // 限制最大行数，避免节点过高
    const maxLines = 30;
    const limitedLines = lines.length > maxLines ? lines.slice(0, maxLines) : lines;
    const textHeight = Math.max(100, (limitedLines.length * lineHeight) + (this.padding * 2));
    
    return {
      width: nodeWidth,
      height: textHeight,
      lines: limitedLines
    };
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  updateText(text) {
    // 处理连续换行符
    const normalizedText = text.replace(/\n{2,}/g, '\n');
    this.text = normalizedText;
    const dimensions = this.calculateDimensions(normalizedText);
    this.width = dimensions.width;
    this.height = dimensions.height;
    this.lines = dimensions.lines;
  }

  updateType(type) {
    this.type = type;
  }
  
  // 添加设置父节点的方法
  setParent(parentId) {
    this.parentId = parentId;
  }

  // 添加子节点的方法
  addChild(childId) {
    if (!this.childrenIds.includes(childId)) {
      this.childrenIds.push(childId);
    }
  }

  // 添加设置层级的方法
  setLevel(level) {
    this.level = level;
  }

  // 添加设置尺寸的方法
  setDimensions(width, height) {
    this.width = Math.min(Math.max(width, this.minWidth), this.maxWidth);
    this.height = height;
  }

  // 计算所有子节点的总高度
  calculateChildrenTotalHeight(allNodes) {
    if (this.childrenIds.length === 0) {
      this.childrenTotalHeight = 0;
      return 0;
    }

    let minY = Infinity;
    let maxY = -Infinity;

    for (const childId of this.childrenIds) {
      const childNode = allNodes.find(node => node.id === childId);
      if (childNode) {
        if (childNode.y < minY) {
          minY = childNode.y;
        }
        if (childNode.y + childNode.height > maxY) {
          maxY = childNode.y + childNode.height;
        }
      }
    }

    const totalHeight = maxY - minY;
    this.childrenTotalHeight = totalHeight;
    return totalHeight;
  }

  calculateTextDimensions() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${this.fontSize}px ${this.fontFamily}`;
    
    const lines = this.text.split('\n');
    const lineHeight = this.fontSize * 1.2;
    const widths = lines.map(line => context.measureText(line).width);
    
    const textWidth = Math.max(...widths);
    const textHeight = lineHeight * lines.length;
    
    // 根据文本宽度确定节点宽度，保持在最小和最大宽度之间
    this.width = Math.min(Math.max(textWidth + (this.padding * 2), this.minWidth), this.maxWidth);
    this.height = Math.max(textHeight + (this.padding * 2), 100);
  }
}

export { RectNode, NODE_TYPES }; 