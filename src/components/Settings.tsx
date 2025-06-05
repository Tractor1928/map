import React, { useState, useEffect } from 'react';
import './Settings.css';
import { aiService } from '../services/ai';
import { aiServiceFactory, ApiMode } from '../services/aiServiceFactory';
import { useAI } from '../hooks/useAI';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('ep-20250211144523-bvb8x');
  const [apiMode, setApiMode] = useState<ApiMode>('mock');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { switchApiMode } = useAI();

  useEffect(() => {
    const savedApiKey = localStorage.getItem('apiKey');
    const savedModel = localStorage.getItem('model');
    const savedMode = localStorage.getItem('api_mode') as ApiMode || 'mock';
    
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedModel) setModel(savedModel);
    else localStorage.setItem('model', 'ep-20250211144523-bvb8x');
    setApiMode(savedMode);
  }, []);

  const handleSave = async () => {
    localStorage.setItem('apiKey', apiKey.trim());
    localStorage.setItem('model', model.trim());
    
    // 保存API模式
    switchApiMode(apiMode);
    
    // 重置错误信息
    setErrorMessage(null);
    
    // 测试连接
    setTesting(true);
    const result = await aiService.testConnection();
    setTestResult(result.success);
    
    if (!result.success && result.message) {
      setErrorMessage(result.message);
    }
    
    setTesting(false);

    if (result.success) {
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <h2 className="settings-title">API 设置</h2>
        <div className="settings-content">
          <div className="settings-field">
            <label className="settings-label">
              API 模式
              <div className="settings-description">
                选择使用真实API或模拟API
              </div>
            </label>
            <div className="settings-radio-group">
              <label className="settings-radio-label">
                <input
                  type="radio"
                  name="apiMode"
                  value="real"
                  checked={apiMode === 'real'}
                  onChange={() => setApiMode('real')}
                  className="settings-radio"
                />
                真实API（消耗API配额）
              </label>
              <label className="settings-radio-label">
                <input
                  type="radio"
                  name="apiMode"
                  value="mock"
                  checked={apiMode === 'mock'}
                  onChange={() => setApiMode('mock')}
                  className="settings-radio"
                />
                模拟API（不消耗API配额）
              </label>
            </div>
          </div>

          <div className="settings-field">
            <label className="settings-label">
              API Key
              <div className="settings-description">
                请输入您的 API Key
              </div>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ARK_API_KEY"
              className="settings-input"
              disabled={apiMode === 'mock'}
            />
          </div>

          <div className="settings-field">
            <label className="settings-label">
              模型名称
              <div className="settings-description">
                请输入要使用的模型名称
              </div>
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="ep-20250211144523-bvb8x"
              className="settings-input"
              disabled={apiMode === 'mock'}
            />
          </div>

          {testResult !== null && (
            <div className={`settings-test-result ${testResult ? 'success' : 'error'}`}>
              {testResult ? '连接测试成功' : errorMessage || '连接测试失败'}
            </div>
          )}

          <div className="settings-help">
            {apiMode === 'mock' ? 
              '模拟API模式下，系统将使用预设回答，不消耗API配额' : 
              '请确保填写正确的API Key和模型名称'}
          </div>
        </div>
        <div className="settings-actions">
          <button
            onClick={onClose}
            className="settings-button cancel"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="settings-button save"
            disabled={testing}
          >
            {testing ? '测试中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}; 