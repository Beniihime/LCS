import { createRouter, createWebHistory } from "vue-router";
import { isAuthenticated } from "@/utils/auth";

const routes = [
    { 
        path: "/", 
        component: () => import('@/views/HomePage.vue'),
        name: 'HomePage',
        props: route =>({ 
            message: route.query.message, 
            detail: route.query.detail 
        }),
        meta: { requiresAuth: true },
        children: [
            {
                path: "/users",
                component: () => import('@/views/UsersPage.vue'),
                name: 'Users',
            },
            {
                path: "/notif",
                // component: () => import('@/components/NotifPage.vue'),
            }
        ]
    }, 
    { 
        path: "/auth", 
        component: () => import('@/views/AuthPage.vue'),
        name: 'Auth',
        meta: { requiresAuth: false }
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!isAuthenticated()) {
            next({
                path: '/auth',
                query: { redirect: to.fullPath }
            });
        } else {
            next();
        }
    } else {
        next();
    }
});

export default router;