const fs = require('fs')
const path = require('path')

const src = path.resolve(__dirname, './dist/index.html') 
const dest = path.resolve(__dirname, './index.html') 

if (fs.existsSync(dest)) {
    fs.unlinkSync(dest)
}

if (fs.existsSync(src)) {
    // 复制到根目录，但保留dist中的原文件（用于GitHub Pages部署）
    fs.copyFileSync(src, dest)
    console.log('✅ index.html已复制到根目录，同时保留在dist目录中')
} else {
    console.log('❌ 未找到dist/index.html文件')
}

// console.warn('请检查付费插件是否启用！！！')