// src/components/Connection/index.jsx
import React from 'react';
import * as d3 from 'd3';
import './Connection.css';

const Connection = ({ startNode, endNode, basePosition }) => {
  // 计算起点和终点
  const startX = startNode.x + basePosition.x + startNode.width;
  const startY = startNode.y + basePosition.y + (startNode.height / 2);
  const endX = endNode.x + basePosition.x;
  const endY = endNode.y + basePosition.y + (endNode.height / 2);
  
  // 计算控制点，使曲线更平滑
  const dx = endX - startX;
  const controlPointOffset = Math.min(Math.max(dx * 0.3, 50), 150); // 控制点偏移量，确保有足够的曲度
  
  // 使用贝塞尔曲线创建更平滑的连接
  const path = `
    M ${startX},${startY}
    C ${startX + controlPointOffset},${startY}
      ${endX - controlPointOffset},${endY}
      ${endX},${endY}
  `;

  // 根据节点类型确定连接线样式
  const isQuestion = endNode.type === 'question';
  const isAnswer = endNode.type === 'answer';
  const connectionClass = `connection-path ${isQuestion ? 'question' : ''} ${isAnswer ? 'answer' : ''}`;
  const markerEnd = isQuestion ? 'url(#arrowhead-question)' : isAnswer ? 'url(#arrowhead-answer)' : 'url(#arrowhead)';
  
  // 根据节点类型设置线条颜色
  const strokeColor = isQuestion ? '#1890ff' : isAnswer ? '#52c41a' : '#999';
  const strokeOpacity = isQuestion || isAnswer ? 0.7 : 1;

  return (
    <path
      d={path}
      fill="none"
      stroke={strokeColor}
      strokeOpacity={strokeOpacity}
      strokeWidth="1.5"
      strokeDasharray={isQuestion ? "5,5" : "none"} // 问题节点使用虚线
      markerEnd={markerEnd}
      className={connectionClass}
    />
  );
};

export default Connection;