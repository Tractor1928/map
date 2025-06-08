// src/utils/nodeCalculations.js
export const calculateNodePosition = (node, parentNode, siblings) => {
    if (!parentNode) {
      return { x: 50, y: 50 };
    }
  
    const horizontalSpacing = 700;
    const verticalSpacing = 80;
    
    const x = 50 + (node.level * horizontalSpacing);
    let y;
  
    if (siblings.length === 0) {
      y = parentNode.y;
    } else {
      const totalHeight = (siblings.length + 1) * verticalSpacing;
      const startY = parentNode.y - (totalHeight / 2) + (verticalSpacing / 2);
      const index = siblings.findIndex(sibling => sibling.id === node.id);
      y = startY + (index * verticalSpacing);
    }
  
    return { x, y };
  };