import React, { useState } from 'react';
import { useAI } from '../hooks/useAI';
import { transformChatToNodes } from '../features/ai/transformers/chatToNodes';
import LoadingSpinner from './LoadingSpinner';
import { AI_PROMPTS } from '../config/prompts';

const AITest: React.FC = () => {
  const { generateResponse, isLoading, error } = useAI();
  const [input, setInput] = useState('');
  const [nodes, setNodes] = useState<any[]>([]);
  const [streamingResponse, setStreamingResponse] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStreamingResponse('');

    const messages = [
      { 
        role: 'system' as const, 
        content: AI_PROMPTS.system
      },
      { 
        role: 'user' as const, 
        content: input 
      }
    ];

    // 处理流式响应
    const onProgress = (content: string) => {
      setStreamingResponse(prev => prev + content);
    };

    const result = await generateResponse(messages, onProgress);
    if (result) {
      // 转换对话为节点
      const newNodes = transformChatToNodes(input, result);
      setNodes(prevNodes => [...prevNodes, ...newNodes]);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>AI 思维导图测试</h2>
      
      <form onSubmit={handleSubmit}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          style={{
            width: '100%',
            height: '100px',
            marginBottom: '10px',
            padding: '8px'
          }}
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          style={{
            padding: '8px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isLoading && <LoadingSpinner />}
          {isLoading ? '生成中...' : '发送'}
        </button>
      </form>

      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '10px',
          padding: '10px',
          backgroundColor: '#ffebee',
          borderRadius: '4px'
        }}>
          错误: {error}
        </div>
      )}

      {/* 显示生成的节点 */}
      <div style={{ marginTop: '20px' }}>
        <h3>生成的节点:</h3>
        <pre style={{ 
          whiteSpace: 'pre-wrap',
          backgroundColor: '#f5f5f5',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}>
          {JSON.stringify(nodes, null, 2)}
        </pre>
      </div>

      {/* 显示实时响应 */}
      {streamingResponse && (
        <div style={{ marginTop: '20px' }}>
          <h3>实时响应:</h3>
          <pre style={{ 
            whiteSpace: 'pre-wrap',
            backgroundColor: '#f5f5f5',
            padding: '15px',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            {streamingResponse}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AITest; 