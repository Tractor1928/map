<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
// 引入AI测试工具（开发环境）
if (process.env.NODE_ENV === 'development') {
  // 加载AI测试工具
  import('@/utils/ai/aiTest.js').then(() => {
    console.log('🧪 AI测试工具已加载完成')
  }).catch(err => {
    console.warn('⚠️ AI测试工具加载失败:', err)
  })
  
  // 加载AI调试助手
  import('@/utils/ai/debugHelper.js').then(() => {
    console.log('🔧 AI调试助手已加载完成')
  }).catch(err => {
    console.warn('⚠️ AI调试助手加载失败:', err)
  })
}

export default {
  name: 'App'
}
</script>

<style lang="less">
// 引入AI响应节点样式
@import './style/aiResponse.less';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
}

.customScrollbar {
  &::-webkit-scrollbar {
    width: 7px;
    height: 7px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 7px;
    background-color: rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }

  &::-webkit-scrollbar-track {
    box-shadow: none;
    background: transparent;
    display: none;
  }
}

.el-dialog{
  border-radius: 10px;
}
</style>
