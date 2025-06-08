# AI思维导图部署指南

## 📋 部署概述

本项目采用**前后端分离**的部署策略：

- **前端应用**: 部署到 GitHub Pages
- **后端代理**: 部署到 Cloudflare Workers（可选）
- **自动化**: 通过 GitHub Actions 实现 CI/CD

## 🚀 快速开始

### 1. 项目初始化

```bash
# 运行设置脚本
node setup.js

# 或手动安装依赖
npm install
cd web && npm install
cd ../worker && npm install  # 如果需要Cloudflare Workers
```

### 2. 配置文件更新

更新以下配置文件中的占位符：

#### `package.json`
```json
{
  "homepage": "https://YOUR_USERNAME.github.io/map"
}
```

#### `worker/index.js`
```javascript
const ALLOWED_ORIGINS = [
  'https://YOUR_USERNAME.github.io',
  // ... 其他域名
];
```

#### `.env`
```env
GITHUB_USERNAME=your_github_username_here
OPENAI_API_KEY=your_openai_api_key_here  # 可选
CLOUDFLARE_API_TOKEN=your_token_here     # 可选
```

## 📦 GitHub Pages 部署

### 手动部署

```bash
# 构建项目
npm run build

# 部署到 GitHub Pages
npm run deploy
```

### 自动部署

1. **启用 GitHub Pages**
   - 进入仓库设置 → Pages
   - 选择 Source: GitHub Actions

2. **推送代码触发部署**
   ```bash
   git add .
   git commit -m "feat: 添加部署配置"
   git push origin main
   ```

3. **查看部署状态**
   - 访问 Actions 标签页查看部署进度
   - 部署成功后访问: `https://YOUR_USERNAME.github.io/map`

## ☁️ Cloudflare Workers 部署（可选）

### 前置条件

1. [Cloudflare账户](https://cloudflare.com)
2. 获取 API Token：
   - 访问 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
   - 创建自定义令牌，权限：`Cloudflare Workers:Edit`

### 手动部署

```bash
cd worker

# 开发模式
npm run dev

# 部署到生产环境
npm run deploy:production
```

### 自动部署

1. **设置 GitHub Secrets**
   - 访问仓库设置 → Secrets and variables → Actions
   - 添加 `CLOUDFLARE_API_TOKEN`

2. **推送worker代码**
   ```bash
   # 只有worker目录变化时才会触发部署
   git add worker/
   git commit -m "feat: 更新worker代理"
   git push origin main
   ```

## 🔧 高级配置

### 自定义域名

#### GitHub Pages 自定义域名

1. 在仓库根目录创建 `CNAME` 文件：
   ```
   your-domain.com
   ```

2. 在域名服务商配置 DNS：
   ```
   CNAME record: your-domain.com → YOUR_USERNAME.github.io
   ```

#### Cloudflare Workers 自定义域名

在 `worker/wrangler.toml` 中添加：
```toml
[env.production.routes]
pattern = "api.your-domain.com/*"
zone_name = "your-domain.com"
```

### 环境变量配置

#### 前端环境变量（web/.env）
```env
VUE_APP_API_BASE_URL=https://your-worker.your-subdomain.workers.dev
VUE_APP_OPENAI_PROXY_URL=https://your-worker.your-subdomain.workers.dev/openai
```

#### Workers 环境变量
在 Cloudflare Dashboard 或 `wrangler.toml` 中设置：
```toml
[env.production.vars]
OPENAI_API_KEY = "your_openai_key"
```

## 🐛 故障排除

### 常见问题

1. **GitHub Actions 部署失败**
   ```bash
   # 检查 package.json 中的脚本是否正确
   npm run build  # 本地测试构建
   ```

2. **GitHub Pages 404 错误**
   - 确保仓库设置中 Pages 源选择正确
   - 检查 `homepage` 字段是否匹配

3. **CORS 错误**
   - 检查 Cloudflare Workers 中的 `ALLOWED_ORIGINS`
   - 确保前端请求的域名在允许列表中

4. **Workers 部署失败**
   ```bash
   # 检查 wrangler.toml 配置
   cd worker
   npx wrangler whoami  # 验证认证
   ```

### 日志查看

```bash
# GitHub Actions 日志
# 访问仓库 → Actions 标签页

# Cloudflare Workers 日志
cd worker
npx wrangler tail  # 实时日志
```

## 📊 监控和维护

### 部署状态监控

- **GitHub Pages**: 在 Actions 页面查看部署状态
- **Cloudflare Workers**: 在 Cloudflare Dashboard 查看指标

### 定期维护

```bash
# 更新依赖
npm update
cd web && npm update
cd ../worker && npm update

# 重新部署
npm run deploy
```

## 🔒 安全最佳实践

1. **API密钥管理**
   - 使用 GitHub Secrets 存储敏感信息
   - 定期轮换 API 密钥

2. **域名安全**
   - 配置适当的 CORS 策略
   - 使用 HTTPS

3. **权限控制**
   - 最小权限原则设置 API Token
   - 定期审查访问权限

## 📞 支持

如果遇到部署问题，请：

1. 检查本文档的故障排除部分
2. 查看 GitHub Issues
3. 提交新的 Issue 并包含详细的错误信息

---

✨ 祝您部署顺利！ 