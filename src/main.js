// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// import './assets/main.css' // <-- 注释掉或删除这行

const app = createApp(App)

app.use(router)

app.mount('#app')