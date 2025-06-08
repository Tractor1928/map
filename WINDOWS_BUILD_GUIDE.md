# Windows环境构建指南

## 🔧 问题说明
在Windows PowerShell中构建项目时遇到的 `--openssl-legacy-provider` 错误是由于Node.js v17+版本与旧版webpack的兼容性问题。

## ✅ 解决方案

### 方案1：使用批处理文件（推荐✅）
```powershell
npm run build:legacy
```
或直接运行：
```cmd
.\build-legacy.bat
```

### 方案2：使用环境变量
```powershell
$env:NODE_OPTIONS="--openssl-legacy-provider"
npm run build:direct
```

### 方案3：使用Windows优化脚本
```powershell
npm run build:win
```

## 📋 可用的构建命令

| 命令 | 说明 | 适用场景 |
|------|------|----------|
| `npm run build` | 主构建脚本（智能检测） | 一般情况 |
| `npm run build:legacy` | 使用legacy provider | Windows推荐 |
| `npm run build:win` | Windows优化版本 | Windows专用 |
| `npm run build:direct` | 直接构建 | 调试用 |
| `npm run build:fallback` | 备用构建脚本 | 应急使用 |

## 🚀 部署到GitHub Pages

### 一键部署（推荐✅）
```powershell
npm run deploy
```

该命令会自动：
1. 运行`build-legacy.bat`构建项目
2. 使用`gh-pages`部署到GitHub Pages

### 分步部署
1. 确保构建成功：
```powershell
npm run build:legacy
```

2. 部署到GitHub Pages：
```powershell
npm run deploy
```

### 部署成功标志
看到"Published"消息表示部署成功！

## 💡 常见问题

### Q: 仍然提示OpenSSL错误？
A: 尝试更新Node.js到最新LTS版本，或使用以下命令：
```powershell
$env:NODE_OPTIONS="--openssl-legacy-provider --max-old-space-size=4096"
npm run build:direct
```

### Q: 构建成功但部署失败？
A: 检查GitHub仓库设置中的Pages配置，确保源分支设置正确。

### Q: 文件过大警告？
A: 这是正常的警告，不影响部署。如需优化，可以考虑代码分割。

## 🔄 GitHub Actions自动部署

项目已配置自动部署，每次推送到main分支时会自动构建和部署。

如果自动部署失败，可以手动触发：
1. 进入GitHub仓库的Actions页面
2. 选择"部署到GitHub Pages"工作流
3. 点击"Run workflow"

## 📁 文件结构

```
dist/              # 构建输出目录
├── css/          # 样式文件
├── js/           # JavaScript文件
├── img/          # 图片资源
├── fonts/        # 字体文件
└── logo.ico      # 图标文件
``` 