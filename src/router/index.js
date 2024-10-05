import { createRouter, createWebHistory } from "vue-router";
import { isAuthenticated } from "@/utils/auth";
import { usePermissionStore } from '@/stores/permissions.js';

const routes = [
    { 
        path: "/", 
        component: () => import('@/views/HomePage.vue'),
        name: 'HomePage',
        meta: { requiresAuth: true },
        children: [
            {
                path: "/users",
                component: () => import('@/views/UsersPage.vue'),
                name: 'Users',
                meta: { permission: { type: 'User', action: 'Read' }, requiresAuth: true }
            },
            {
                path: "/notif",
                component: () => import('@/views/NotifPage.vue'),
                meta: { requiresAuth: true  }
            },
            {
                path: "/rbac",
                component: () => import('@/views/RbacPage.vue'),
                name: 'Rbac',
                meta: { permission: { type: 'Rbac', action: 'Read' }, requiresAuth: true  }
            },
            {
                path: "/me-permissions",
                component: () => import('@/views/MePermissionsPage.vue'),
                name: 'MePermissions',
            },
            {
                path: "/role-permissions",
                component: () => import('@/views/RolePermissionsPage.vue'),
                name: 'RolePermissions',
                meta: { permission: { type: 'Rbac', action: 'Create' }, requiresAuth: true  }
            },
            {
                path: "/profile",
                component: () => import('@/views/ProfilePage.vue'),
                name: 'Profile',
                meta: { requiresAuth: true  }
            },
            {
                path: "/services",
                component: () => import('@/views/ServicesPage.vue'),
                name: 'Services',
                meta: { permission: { type: 'InfraManager', action: 'Read' }, requiresAuth: true  }
            },
        ]
    }, 
    { 
        path: "/auth", 
        component: () => import('@/views/AuthPage.vue'),
        name: 'Auth',
        meta: { requiresAuth: false }
    },
    {
        path: '/noAccess',
        component: () => import('@/components/Utils/PermissionDenied.vue'),
        name: 'NoAccess'
    },
    {
        path: '/notFound',
        component: () => import('@/components/Utils/NotFound.vue'),
        name: 'NotFound'
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/notFound'
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach(async (to, from) => {
    const permissionStore = usePermissionStore();

    if (to.path === '/auth' && isAuthenticated()) {
        return { path: '/' };  // Перенаправляем на главную страницу
    }
    
    // Если маршрут требует полномочий
    if (to.meta.permission) {
        try {
              // Ждём загрузки полномочий
        } catch (error) {
            console.error('Ошибка при загрузке полномочий:', error);
            return { path: '/auth' };  // Если ошибка при загрузке, отправляем на страницу авторизации
        }
        
        const { type, action } = to.meta.permission;
        
        // Проверяем, есть ли у пользователя соответсвующее полномочие
        if (permissionStore.hasPermission(type, action)) {
            return true;  // Продолжаем маршрут
        } else {
            return { path: '/noAccess' };  // Если полномочий нет, перенаправляем на страницу "Нет доступа"
        }
    }

    // Проверка авторизации
    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!isAuthenticated()) {
            return {
                path: '/auth',
                replace: true
            };
        }
    }

    // Разрешаем навигацию
    return true;
});

router.afterEach((to) => {
    if (to.meta.requiresAuth) {
        if (!isAuthenticated()) {
            if (window) {
                window.history.replaceState(null, '', window.location.href);
                window.onpopstate = () => {
                    window.history.forward();
                }
            }
        }
    }
})


export default router;