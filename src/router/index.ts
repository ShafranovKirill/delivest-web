import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'
import { branchGuard } from './middleware/branchGuard'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/select-branch',
      name: 'select-branch',
      component: () => import('@/views/SelectBranchView.vue'),
    },
    {
      path: '/:slug',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'menu',
          component: () => import('@/modules/menu/components/MenuView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/select-branch',
    },
  ],
})

router.beforeEach(branchGuard)

export default router
