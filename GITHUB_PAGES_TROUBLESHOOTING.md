# GitHub Pages 部署故障排除指南

## ✅ 部署状态检查清单

### 1. 确认仓库设置
访问：**https://github.com/Tractor1928/map/settings/pages**

应该看到以下配置：
- ✅ **Source**: Deploy from a branch
- ✅ **Branch**: gh-pages
- ✅ **Folder**: / (root)

### 2. 检查部署状态
访问：**https://github.com/Tractor1928/map/actions**

查看最新的工作流：
- ✅ **pages build and deployment** - 应该显示绿色✅
- ✅ **部署到GitHub Pages** - 应该显示绿色✅

### 3. 确认分支存在
访问：**https://github.com/Tractor1928/map/tree/gh-pages**

应该包含以下文件：
- ✅ `index.html`
- ✅ `css/` 目录
- ✅ `js/` 目录
- ✅ `img/` 目录

## 🌐 访问地址

### 主要地址
**https://Tractor1928.github.io/map**

### 备用地址（如果用户名不同）
- https://tractor1928.github.io/map （小写）
- https://Tractor1928.github.io/map/ （带斜杠）

## ⏰ 等待时间

GitHub Pages部署后需要等待：
- **首次部署**: 5-20分钟
- **后续更新**: 1-5分钟
- **DNS传播**: 最多24小时（罕见）

## 🔍 诊断步骤

### 步骤1：检查分支内容
1. 访问 https://github.com/Tractor1928/map/tree/gh-pages
2. 确认 `index.html` 文件存在且内容正确

### 步骤2：检查Pages设置
1. 前往 Settings → Pages
2. 确认配置为 "Deploy from a branch: gh-pages"
3. 如果配置错误，重新选择正确的分支并保存

### 步骤3：强制重新部署
如果配置正确但仍然404，尝试：
```bash
# 重新部署
npm run deploy

# 或手动触发
git checkout gh-pages
git pull origin gh-pages
git push origin gh-pages
```

### 步骤4：检查域名解析
使用在线工具检查DNS：
- https://www.whatsmydns.net
- 输入：tractor1928.github.io

## 🚨 常见问题

### 问题1：404 页面
**原因**: 
- Pages设置错误
- 分支选择错误
- index.html文件缺失

**解决**: 
- 确认分支设置为 `gh-pages`
- 检查分支是否包含 `index.html`

### 问题2：CSS/JS 404
**原因**: 
- 相对路径问题
- base URL配置错误

**解决**: 
- 检查 `vue.config.js` 中的 `publicPath` 设置
- 确认应该设置为 `./` 或 `/map/`

### 问题3：仍然显示旧内容
**原因**: 
- 浏览器缓存
- CDN缓存

**解决**: 
- 强制刷新页面 (Ctrl+F5)
- 使用无痕模式访问
- 清除浏览器缓存

## 🛠️ 手动验证

### 检查分支内容
```bash
git checkout gh-pages
ls -la
# 应该看到构建后的文件
```

### 检查最后提交
```bash
git log --oneline -5
# 查看最近的提交记录
```

## 📞 如果仍然无法解决

1. 等待30分钟后重试
2. 检查GitHub状态页：https://www.githubstatus.com
3. 尝试重新配置Pages设置
4. 联系GitHub支持

---

**预期访问地址**: https://Tractor1928.github.io/map
**部署时间**: 2024年6月8日 22:41
**状态**: ✅ 已修复index.html问题并重新部署成功
**关键修复**: 修改了copy.js脚本，确保dist目录保留index.html文件 