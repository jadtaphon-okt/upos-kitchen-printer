import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import Toast from '../plugins/Toast'

const toast = new Toast()

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'LoginPage',
        component: () => import('@/views/LoginPage.vue')
    },
    {
        path: '/order',
        name: 'OrderPage',
        component: () => import('@/views/OrderPage.vue')
    },
    {
        path: '/config',
        name: 'ConfigPage',
        component: () => import('@/views/ConfigPage.vue')
    },
    {
        path: '/history',
        name: 'HistoryPage',
        component: () => import('@/views/HistoryPage.vue')
    },
    {
        path: '/change-status',
        name: 'UpdateStatusPage',
        component: () => import('@/views/UpdateStatusPage.vue')
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

router.beforeEach(async (to, from, next) => {
    const nameExceptions = ['LoginPage', 'ConfigPage']
    if (!nameExceptions.includes(to.name as string) && !localStorage.getItem('token')) {
        await toast.warning('Please login to continue')
        next({ name: 'LoginPage' })
    } else {
        next()
    }
})

export default router
