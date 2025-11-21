<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
// App.vue 现在只负责渲染路由视图
</script>

<style>
/* 全局基础样式 */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #fff; /* 白色文字 */
  background-color: #000; /* 黑色背景 */
  min-height: 100vh; /* 确保占满视口高度 */
  display: flex; /* 使用 flexbox 布局 */
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  overflow: hidden; /* 防止内容溢出 */
}
</style>