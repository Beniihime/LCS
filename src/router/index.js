import { createRouter, createWebHistory } from "vue-router";
import Home from '@/components/Home.vue';
import AuthPage from '@/components/AuthPage.vue';
import { isAuthenticated } from "@/utils/auth";
import UsersPage from '@/components/UsersPage.vue';

const routes = [
    { 
        path: "/", 
        component: Home,
        name: 'Home',
        props: route =>({ 
            message: route.query.message, 
            detail: route.query.detail 
        }),
        meta: { requiresAuth: true },
        children: [
            {
                path: "/users",
                component: UsersPage,
                name: 'Users',
            },
            {
                path: "/notif",
                
            }
        ]
    }, 
    { 
        path: "/auth", 
        component: AuthPage,
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