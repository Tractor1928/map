#!/usr/bin/env node

/**
 * 构建脚本 - 使用legacy OpenSSL provider
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 开始构建项目...');

// 构建命令
const buildProcess = spawn('node', [
  '--openssl-legacy-provider',
  path.join(__dirname, 'web/node_modules/.bin/vue-cli-service'),
  'build'
], {
  cwd: path.join(__dirname, 'web'),
  stdio: 'inherit'
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Vue项目构建成功');
    
    // 执行copy.js
    console.log('📦 执行文件复制...');
    const copyProcess = spawn('node', [path.join(__dirname, 'copy.js')], {
      stdio: 'inherit'
    });
    
    copyProcess.on('close', (copyCode) => {
      if (copyCode === 0) {
        console.log('✅ 构建完成！');
        process.exit(0);
      } else {
        console.error('❌ 文件复制失败');
        process.exit(copyCode);
      }
    });
  } else {
    console.error('❌ Vue项目构建失败');
    process.exit(code);
  }
});

buildProcess.on('error', (err) => {
  console.error('❌ 构建过程出错:', err.message);
  process.exit(1);
}); 