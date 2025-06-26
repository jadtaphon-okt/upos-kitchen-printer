import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'

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
    }
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
})

export default router
