export const isNodeVisible = (node, viewport, scale) => {
  const margin = 100; // 缓冲区
  return (
    node.x + node.width > viewport.left - margin &&
    node.x < viewport.right + margin &&
    node.y + node.height > viewport.top - margin &&
    node.y < viewport.bottom + margin
  );
};

export class Viewport {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.scale = 1;
    this.x = 0;
    this.y = 0;
  }

  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    };
  }

  pan(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  zoom(scale, centerX, centerY) {
    const oldScale = this.scale;
    this.scale = Math.min(Math.max(0.1, scale), 4);
    
    // 调整平移以保持缩放中心点不变
    this.x += centerX - (centerX * (this.scale / oldScale));
    this.y += centerY - (centerY * (this.scale / oldScale));
  }
} 