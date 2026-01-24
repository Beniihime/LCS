import { createMemoryHistory, createRouter, createWebHistory } from "vue-router";
import { isAuthenticated } from "@/utils/auth";
import { usePermissionStore } from '@/stores/permissions.js';

const routes = [
    { 
        path: "/auth", 
        component: () => import('@/views/AuthPage.vue'),
        name: 'Auth',
        meta: { 
            requiresAuth: false,
            title: 'Вход'
        }
    },
    {
        path: '/noAccess',
        component: () => import('@/components/Utils/PermissionDenied.vue'),
        name: 'NoAccess',
        meta: {
            title: '403',
        }
    },
    {
        path: '/notFound',
        component: () => import('@/components/Utils/NotFound.vue'),
        name: 'NotFound',
        meta: {
            title: '404',
        }
    },
    {
        path: "/login/sso",
        component: () => import('@/views/SsoCallbackPage.vue'),
        meta: {
            title: 'Ожидание авторизации'
        }
    },
    { 
        path: "/", 
        component: () => import('@/views/HomePage.vue'),
        name: 'HomePage',
        meta: { 
            requiresAuth: true,
            title: 'Главная'
        },
        children: [
            // Dashboard
            {
                path: "/overview",
                component: () => import('@/views/DashboardPage.vue'),
                name: 'Dashboard'
            },
            // Users section
            {
                path: "/users",
                component: () => import('@/views/UsersPage.vue'),
                name: 'Users',
                meta: { 
                    permission: { 
                        type: 'User', 
                        action: 'Read' 
                    }, 
                    requiresAuth: true, 
                    title: 'Пользователи' 
                }
            },
            {
                path: "/profile",
                props: (route) => ({ id: route.query.id }),
                component: () => import('@/views/ProfilePage.vue'),
                name: 'Profile',
                meta: { 
                    requiresAuth: true,
                    title: 'Личный кабинет'
                }
            },
            // RBAC section
            {
                path: "/rbac",
                component: () => import('@/views/RbacPage.vue'),
                name: 'Rbac',
                meta: { 
                    permission: { 
                        type: 'Rbac', 
                        action: 'Read' 
                    }, 
                    requiresAuth: true,
                    title: 'Роли'
                }
            },
            {
                path: "/me-permissions",
                component: () => import('@/views/MePermissionsPage.vue'),
                name: 'MePermissions',
                meta: {
                    title: 'Мои полномочия'
                }
            },
            {
                path: "/role-permissions",
                component: () => import('@/views/RolePermissionsPage.vue'),
                name: 'RolePermissions',
                meta: { 
                    permission: { 
                        type: 'Rbac', 
                        action: 'Create' 
                    }, 
                    requiresAuth: true,
                    title: 'Полномочия роли'
                }
            },
            // Services section
            {
                path: "/services",
                component: () => import('@/views/ServicesPage.vue'),
                name: 'Services',
                meta: { 
                    permission: { 
                        type: 'InfraManager', 
                        action: 'Read' 
                    }, 
                    requiresAuth: true,
                    title: 'Микросервисы'
                },
            },
            {
                path: "/services/infraManager",
                component: () => import('@/components/Microservice/InfraManager/InfraManagerTable.vue'),
                name: 'InfraTable',
                meta: {
                    title: 'Все Заявки'
                }
            },
            {
                path: "/services/rating",
                component: () => import('@/components/Microservice/Rating/RatingSeasons.vue'),
                name: 'Seasons',
                meta: {
                    title: 'Сезон'
                }
            },
            {
                path: "/services/rating/season/:idSeason",
                component: () => import('@/components/Microservice/Rating/CertainSeason.vue'),
                name: 'Indicators',
                meta: {
                    title: 'Показатели'
                },
            },
            // Requests section
            {
                path: "/requests",
                component: () => import('@/views/RequestsPage.vue'),
                name: 'Requests',
                meta: {
                    title: 'Заявки'
                }
            },
            // Schedule section
            {
                path: "/schedule",
                component: () => import('@/views/SchedulePage.vue'),
                name: 'Schedule',
                meta: {
                    title: 'Расписание'
                }
            },
            {
                path: "/schedule/group/:idGroup",
                component: () => import('@/components/Schedule/ScheduleGroup.vue'),
                name: 'ScheduleGroup',
            },
            {
                path: "/schedule/room/:idAudLine",
                component: () => import('@/components/Schedule/ScheduleAud.vue'),
                name: 'ScheduleAud',
            },
            {
                path: "/schedule/teacher/:idTeacher",
                component: () => import('@/components/Schedule/ScheduleTeach.vue'),
                name: 'ScheduleTeach',
            },
            // Notifications
            {
                path: "/notif",
                component: () => import('@/views/NotifPage.vue'),
                meta: { 
                    requiresAuth: true,
                    title: 'Уведомления'
                }
            },
            // ResponsibleTicketStudentGroup
            {
                path: "/tickets/responsibles",
                component: () => import('@/views/ResponsibleTicketsStudentGroup.vue'),
                meta: {
                    permission: {
                        type: 'ResponsibleTicketStudentGroup',
                        action: 'Read'
                    },
                    requiresAuth: true,
                    title: 'Ответственные(справки)'
                }
            },
            // Tickets
            {
                path: "/tickets",
                component: () => import('@/views/TicketsPage.vue'),
                meta: {
                    permission: {
                        type: 'Tickets',
                        action: 'Read'
                    },
                    requiresAuth: true,
                    title: 'Справки'
                }
            },
            // SSO
            {
                path: "/sso/config",
                component: () => import('@/views/SsoConfig.vue'),
                meta: {
                    requiresAuth: true,
                    title: 'Настройка SSO'
                }
            },
            // AutoRoleAssigner
            {
                path: "/autorole",
                component: () => import('@/views/AutoRolesManagerPage.vue'),
                meta: {
                    requiresAuth: true,
                    title: 'Авто Роли'
                }
            }
        ]
    }, 
    {
        path: '/:pathMatch(.*)*',
        redirect: '/notFound'
    }
];

const router = createRouter({
    history: typeof window !== "undefined" ? createWebHistory() : createMemoryHistory(),
    routes
});

router.beforeEach(async (to, from) => {
    let title = typeof to.meta.title === 'string' ? to.meta.title : 'none';

    if (to.name === 'ScheduleGroup') {
        title = 'Загрузка...';
    }

    document.title = `${title} - LCS`;

    const permissionStore = usePermissionStore();

     // Если пользователь авторизован, загружаем полномочия
    if (isAuthenticated() && !permissionStore.isLoaded) {
        try {
            await permissionStore.fetchPermissions();  // Дожидаемся загрузки полномочий
        } catch (error) {
            console.debug('Ошибка при загрузке полномочий:', error);

            // Если ошибка сервера, перенаправляем на страницу "Нет доступы"
            if (error.response?.status === 502) {
                return { path: '/noAccess' };
            }

            return { path: '/auth' };
        }
    }

    if (to.path === '/auth' && isAuthenticated()) {
        return { path: '/overview' };  // Перенаправляем на главную страницу
    }
    
    // Проверка полномочий, если маршрут требует их
    if (to.meta.permission) {
        const { type, action } = to.meta.permission;
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

    return true; // Разрешаем навигацию
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