#!/usr/bin/env node

/**
 * AI思维导图项目设置脚本
 * 用于安装依赖、初始化配置和设置部署环境
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始设置AI思维导图项目...\n');

// 检查Node.js版本
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    console.error('❌ 需要Node.js 16或更高版本，当前版本:', nodeVersion);
    process.exit(1);
  }
  console.log('✅ Node.js版本检查通过:', nodeVersion);
}

// 执行命令的辅助函数
function runCommand(command, cwd = process.cwd()) {
  console.log(`📦 执行: ${command}`);
  try {
    execSync(command, { 
      stdio: 'inherit', 
      cwd,
      encoding: 'utf8'
    });
    console.log('✅ 命令执行成功\n');
  } catch (error) {
    console.error(`❌ 命令执行失败: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// 安装依赖
function installDependencies() {
  console.log('📦 安装项目依赖...\n');
  
  // 安装根目录依赖
  console.log('安装根目录依赖:');
  runCommand('npm install');
  
  // 安装web目录依赖
  console.log('安装web目录依赖:');
  runCommand('npm install', path.join(process.cwd(), 'web'));
  
  // 安装worker目录依赖 (如果需要)
  const workerPath = path.join(process.cwd(), 'worker');
  if (fs.existsSync(workerPath)) {
    console.log('安装worker目录依赖:');
    runCommand('npm install', workerPath);
  }
}

// 创建环境配置文件示例
function createEnvFiles() {
  console.log('📝 创建环境配置文件...\n');
  
  const envExample = `# AI思维导图环境配置
# 复制此文件为.env并填入实际值

# OpenAI API配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com

# Cloudflare Workers配置（可选）
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id_here

# GitHub Pages配置
GITHUB_USERNAME=your_github_username_here
GITHUB_REPOSITORY=map
`;

  fs.writeFileSync('.env.example', envExample);
  console.log('✅ 已创建 .env.example 文件');
  
  if (!fs.existsSync('.env')) {
    fs.writeFileSync('.env', envExample);
    console.log('✅ 已创建 .env 文件');
  }
}

// 更新配置文件中的占位符
function updateConfigs() {
  console.log('📝 提示更新配置文件...\n');
  
  console.log('⚠️  请记得更新以下配置文件中的占位符:');
  console.log('1. package.json - 更新 YOUR_USERNAME 为您的GitHub用户名');
  console.log('2. worker/index.js - 更新 YOUR_USERNAME 为您的GitHub用户名');
  console.log('3. .env - 填入实际的API密钥和配置');
  console.log('');
}

// 显示下一步操作
function showNextSteps() {
  console.log('🎉 项目设置完成！\n');
  console.log('下一步操作:');
  console.log('1. 编辑 .env 文件，填入实际的API密钥');
  console.log('2. 更新 package.json 中的GitHub用户名');
  console.log('3. 运行 npm run dev 启动开发服务器');
  console.log('4. 运行 npm run build 构建项目');
  console.log('5. 运行 npm run deploy 部署到GitHub Pages');
  console.log('');
  console.log('GitHub Actions部署:');
  console.log('- 推送代码到GitHub会自动触发部署');
  console.log('- 需要在GitHub仓库设置中启用Pages功能');
  console.log('- 如需Cloudflare Workers，需要设置 CLOUDFLARE_API_TOKEN secret');
  console.log('');
  console.log('🚀 开始愉快的开发吧！');
}

// 主函数
function main() {
  try {
    checkNodeVersion();
    installDependencies();
    createEnvFiles();
    updateConfigs();
    showNextSteps();
  } catch (error) {
    console.error('❌ 设置过程中出现错误:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { main }; 