import { createRouter, createWebHistory } from 'vue-router'
import { branchMiddleware } from './middleware/branch.middleware'
import SelectBranchView from '@/modules/branch/views/SelectBranchView.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import MenuView from '@/modules/menu/components/MenuView.vue'
import StockView from '@/modules/stock/views/StockView.vue'
import BranchInfoView from '@/modules/branch/views/BranchInfoView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/select-branch',
      name: 'select-branch',
      component: SelectBranchView,
    },
    {
      path: '/:slug',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'menu',
          component: MenuView,
        },
        {
          path: 'promotions',
          name: 'promotions',
          component: StockView,
        },
        {
          path: 'branch-info',
          name: 'branch-info',
          component: BranchInfoView,
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/select-branch',
    },
  ],
})

router.beforeEach(branchMiddleware)

export default router
