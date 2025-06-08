// 计算文本尺寸的工具函数
export const measureText = (text, fontSize = 14, fontFamily = 'Arial') => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontSize}px ${fontFamily}`;
  
  const lines = text.split('\n');
  const lineHeight = fontSize * 1.2; // 行高为字体大小的1.2倍
  const widths = lines.map(line => context.measureText(line).width);
  
  return {
    width: Math.max(...widths),
    height: lineHeight * lines.length
  };
};

// 文本自动换行函数
export const wrapText = (text, maxWidth, fontSize = 14, fontFamily = 'Arial') => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontSize}px ${fontFamily}`;
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = context.measureText(`${currentLine} ${word}`).width;
    if (width < maxWidth) {
      currentLine += ` ${word}`;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  
  return lines;
}; 