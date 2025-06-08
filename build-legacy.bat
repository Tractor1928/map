@echo off
echo 🚀 开始构建项目（Legacy Provider模式）...
echo 📋 Node.js版本: %npm_config_node_version%

set NODE_OPTIONS=--openssl-legacy-provider
cd web
npm run build
cd ..

if %errorlevel% == 0 (
    echo ✅ 构建完成！
) else (
    echo ❌ 构建失败
    exit /b %errorlevel%
) 