import { createRouter, createWebHistory } from 'vue-router'
import { branchMiddleware } from './middleware/branch.middleware'
import MainLayout from '@/layouts/MainLayout.vue'
import MenuView from '@/modules/menu/views/MenuView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.path === from.path) return false
    return { top: 0, left: 0 }
  },
  routes: [
    {
      path: '/select-branch',
      name: 'select-branch',
      component: () => import('@/modules/branch/views/SelectBranchView.vue'),
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
          component: () => import('@/modules/stock/views/StockView.vue'),
        },
        {
          path: 'branch-info',
          name: 'branch-info',
          component: () => import('@/modules/branch/views/BranchInfoView.vue'),
        },
        {
          path: 'contacts',
          name: 'contacts',
          component: () => import('@/modules/widgets/contacts/views/ContactsView.vue'),
        },
        {
          path: 'checkout',
          name: 'checkout',
          component: () => import('@/modules/order/views/CheckoutView.vue'),
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
