#!/usr/bin/env node

/**
 * 备用构建脚本 - 简单版本，不使用legacy provider
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 开始构建项目（备用脚本）...');
console.log(`📋 Node.js版本: ${process.version}`);

// 直接使用vue-cli-service构建
const buildProcess = spawn('npm', ['run', 'build'], {
  cwd: path.join(__dirname, 'web'),
  stdio: 'inherit',
  shell: true
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ 构建完成！');
    process.exit(0);
  } else {
    console.error('❌ 构建失败');
    process.exit(code);
  }
});

buildProcess.on('error', (err) => {
  console.error('❌ 构建过程出错:', err.message);
  process.exit(1);
}); 