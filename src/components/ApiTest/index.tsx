import React from 'react';
import { ApiTestPanel } from './ApiTestPanel';

/**
 * API测试模块入口组件
 */
const ApiTest: React.FC = () => {
  return (
    <div className="api-test-container">
      <h1>API 测试模块</h1>
      <p className="api-test-description">
        此模块用于测试AI API的响应，支持真实API和模拟API两种模式。
        模拟API不消耗API配额，适合开发和测试阶段使用。
      </p>
      <ApiTestPanel />
    </div>
  );
};

export default ApiTest; 