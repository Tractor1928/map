#!/usr/bin/env node

/**
 * Windows环境构建脚本 - 优化版本
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 开始构建项目（Windows优化版）...');
console.log(`📋 Node.js版本: ${process.version}`);
console.log(`📋 操作系统: ${process.platform}`);

// 设置环境变量并执行构建
const buildProcess = spawn('powershell', [
  '-Command', 
  '$env:NODE_OPTIONS="--openssl-legacy-provider"; cd web; npm run build'
], {
  stdio: 'inherit',
  shell: false
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ 构建完成！');
    process.exit(0);
  } else {
    console.error('❌ 构建失败');
    console.error('💡 请尝试手动运行: $env:NODE_OPTIONS="--openssl-legacy-provider"; npm run build:direct');
    process.exit(code);
  }
});

buildProcess.on('error', (err) => {
  console.error('❌ 构建过程出错:', err.message);
  console.error('💡 请尝试手动运行: $env:NODE_OPTIONS="--openssl-legacy-provider"; npm run build:direct');
  process.exit(1);
}); 