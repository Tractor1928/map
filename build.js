#!/usr/bin/env node

/**
 * 构建脚本 - 兼容不同Node.js版本
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 开始构建项目...');

// 检查Node.js版本并决定是否使用legacy provider
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

let buildArgs = [
  path.join(__dirname, 'web/node_modules/.bin/vue-cli-service'),
  'build'
];

// 只在Node.js 17+且支持legacy provider时才添加此选项
if (majorVersion >= 17) {
  buildArgs.unshift('--openssl-legacy-provider');
}

console.log(`📋 Node.js版本: ${nodeVersion}`);
console.log(`📋 构建参数: node ${buildArgs.join(' ')}`);

// Windows环境下使用不同的构建方式
const isWindows = process.platform === 'win32';

const buildProcess = isWindows ? 
  spawn('npm', ['run', 'build'], {
    cwd: path.join(__dirname, 'web'),
    stdio: 'inherit',
    shell: true
  }) :
  spawn('node', buildArgs, {
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
    console.error(`💡 如果遇到OpenSSL相关错误，请尝试更新Node.js版本或使用不同的构建命令`);
    process.exit(code);
  }
});

buildProcess.on('error', (err) => {
  console.error('❌ 构建过程出错:', err.message);
  console.error('💡 建议检查Node.js版本和环境配置');
  process.exit(1);
}); 