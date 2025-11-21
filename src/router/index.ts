import { createRouter, createWebHistory } from 'vue-router'
import ProteinView from '../views/ProteinView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Protein',
      component: ProteinView
    },
    // 移除所有旧的路由
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFound.vue') // 如果需要的话
    }
  ]
})

export default router