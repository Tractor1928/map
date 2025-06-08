import React, { useState, useEffect } from 'react';
import { useAI } from '../../hooks/useAI';
import { transformChatToNodes } from '../../utils/nodeTransformer';
import LoadingSpinner from '../LoadingSpinner';
import './ApiTestPanel.css';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ApiMode } from '../../services/aiServiceFactory';

export const ApiTestPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<any[]>([]);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const { 
    generateResponse, 
    apiMode, 
    switchApiMode, 
    testConnection,
    isLoading 
  } = useAI();
  
  // 清除所有状态
  const clearAll = () => {
    setResponse('');
    setStreamingResponse('');
    setReasoning('');
    setError(null);
    setNodes([]);
    setResponseTime(null);
  };
  
  // 处理API模式切换
  const handleModeChange = (mode: ApiMode) => {
    switchApiMode(mode);
    clearAll();
    checkConnection();
  };
  
  // 检查API连接状态
  const checkConnection = async () => {
    setConnectionStatus(null);
    setConnectionError(null);
    const result = await testConnection();
    setConnectionStatus(result.success);
    if (!result.success && result.message) {
      setConnectionError(result.message);
    }
  };
  
  // 组件挂载时检查连接
  useEffect(() => {
    checkConnection();
    
    // 添加提示信息
    if (apiMode === 'mock') {
      console.info('当前使用模拟API模式，不消耗API配额');
    } else {
      console.info('当前使用真实API模式，将消耗API配额');
    }
  }, [apiMode]);
  
  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    clearAll();
    setLoading(true);
    
    const startTime = Date.now();
    
    try {
      const messages: ChatCompletionMessageParam[] = [
        { role: 'system', content: '你是一个思维导图助手，帮助用户创建和组织思维导图。' },
        { role: 'user', content: input }
      ];
      
      const result = await generateResponse(
        messages,
        (content) => setStreamingResponse(prev => prev + content),
        (reasoning) => setReasoning(prev => prev + reasoning)
      );
      
      if (result) {
        setResponse(result);
        
        // 计算响应时间
        const endTime = Date.now();
        setResponseTime(endTime - startTime);
        
        // 转换为节点
        const generatedNodes = transformChatToNodes(messages, result);
        setNodes(generatedNodes);
      }
    } catch (err: any) {
      setError(err.message || '请求失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 预设问题列表
  const presetQuestions = [
    '什么是思维导图',
    '如何使用这个应用',
    '思维导图有什么好处',
    '如何制作好的思维导图'
  ];
  
  // 设置预设问题
  const handlePresetQuestionClick = (question: string) => {
    setInput(question);
  };
  
  return (
    <div className="api-test-panel">
      <h2>API 测试面板</h2>
      
      <div className="api-mode-selector">
        <button 
          className={`mode-button ${apiMode === 'mock' ? 'active' : ''}`}
          onClick={() => handleModeChange('mock')}
        >
          模拟 API
        </button>
        <button 
          className={`mode-button ${apiMode === 'real' ? 'active' : ''}`}
          onClick={() => handleModeChange('real')}
        >
          真实 API
        </button>
      </div>
      
      <div className="connection-status">
        {connectionStatus === null ? (
          <p>检查连接中...</p>
        ) : connectionStatus ? (
          <p className="status-success">✓ API 连接正常</p>
        ) : (
          <p className="status-error">✗ API 连接失败{connectionError ? `：${connectionError}` : ''}</p>
        )}
      </div>
      
      <div className="preset-questions">
        <h3>预设问题:</h3>
        <div className="question-buttons">
          {presetQuestions.map((question, index) => (
            <button 
              key={index} 
              onClick={() => handlePresetQuestionClick(question)}
              className="preset-question-button"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="input-form">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          rows={4}
          className="input-textarea"
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim() || connectionStatus === false} 
          className="submit-button"
        >
          {isLoading ? <LoadingSpinner /> : '发送'}
        </button>
      </form>
      
      {error && (
        <div className="error-message">
          <h3>错误:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {responseTime !== null && (
        <div className="response-time">
          <p>响应时间: {responseTime}ms</p>
        </div>
      )}
      
      {reasoning && (
        <div className="reasoning-section">
          <h3>思考过程:</h3>
          <pre className="reasoning-content">{reasoning}</pre>
        </div>
      )}
      
      {streamingResponse && (
        <div className="response-section">
          <h3>实时响应:</h3>
          <div className="response-content">{streamingResponse}</div>
        </div>
      )}
      
      {nodes.length > 0 && (
        <div className="nodes-section">
          <h3>生成的节点:</h3>
          <pre className="nodes-content">{JSON.stringify(nodes, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}; 