<template>
    <ConfirmDialog></ConfirmDialog>
    <div class="sidebar-container bg-image" v-if="isMobile">
        <div class="rectangle">
            <div class="d-flex align-items-center justify-content-center">
                <router-link to="/overview" class="logoLCS">
                    <Lcs />
                </router-link>
            </div>
            
            <IconField class="searchBar">
                <InputIcon class="pi pi-search" />
                <InputText id="searchQuery" name="searchQuery" class="search" v-model="searchQuery" placeholder="Поиск..." />
            </IconField>
            <div class="menu mt-4">
                <router-link to="/overview" class="menu-item" active-class="active-link">
                    <i class="pi pi-home"></i>
                    <div class="menucrumb">Главная</div>
                </router-link>
                <router-link to="/notif" class="menu-item" active-class="active-link">
                    <i class="pi pi-bell"></i>
                    <div class="menucrumb">
                        <span>Уведомления</span>
                        <Badge 
                            v-if="notificationStore.unreadCount > 0"
                            :value="notificationStore.unreadCount"
                            class="p-badge ms-3"
                        />
                    </div>
                </router-link>
            </div>
            <div class="menu">
                <div class="general mt-4" v-if="menuItems">Сервисы</div>
                <div v-for="item in menuItems">
                    <router-link 
                        :key="item.path" 
                        :to="item.path" 
                        class="menu-item" 
                        active-class="active-link"
                        v-if="checkPermission(item.path) && showRequestsMenu"
                    >
                        <i :class="item.icon"></i>
                        <div class="menucrumb">
                            <span>{{ item.name }}</span>
                            <Badge 
                                v-if="item.path === '/notif' && notificationStore.unreadCount > 0"
                                :value="notificationStore.unreadCount"
                                class="p-badge ms-3"
                            />
                        </div>
                    </router-link>
                </div>
                <router-link to="/schedule" class="menu-item" active-class="active-link">
                    <i class="pi pi-calendar"></i>
                    <div class="menucrumb">Расписание</div>
                </router-link>
            </div>
            <div class="menu">
                <div class="general mt-4" v-if="hasPermission('User', 'Read')">Администрирование</div>
                <div v-for="item in filteredMenuItems">
                    <router-link 
                        :key="item.path" 
                        :to="item.path" 
                        class="menu-item"
                        active-class="active-link"
                        v-if="checkPermission(item.path)"
                    >
                        
                        <i :class="item.icon"></i>
                        <div class="menucrumb">
                            <span>{{ item.name }}</span>
                        </div>
                    </router-link>
                </div>
            </div>

            <Divider style="margin-top: auto;" />

            <ThemeSwitcher :isSideBarCollapse="false"/>
            
            <router-link class="profile" :to="userId ? `/profile?id=${userId}&r=${roleId}` : '/profile'" >
                <div class="row align-items-center">
                    <div class="col-auto">
                        <Avatar 
                            :label="initials" 
                            size="xlarge" 
                            shape="circle" 
                            class="initials-circle"
                        />
                    </div>
                    <div class="col ps-0">
                        <div class="middle">
                            <div class="row">
                                <div class="col">{{ fullName }}</div>
                            </div>
                            <div class="row">
                                <div class="col email">
                                    {{ email }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </router-link>
            <div class="row mt-3">
                <div class="col">
                    <button @click="confirmLogout()" class="logout-button">
                        <div class="d-flex align-items-center justify-content-start">
                            <LogoutSvg class="me-3"/>
                            <p class="m-0">Выйти из аккаунта</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onBeforeMount, onBeforeUnmount } from 'vue';
import LogoutSvg from '@/assets/logout.svg';
import axiosInstance from '@/utils/axios.js';

import Lcs from '@/assets/logo/lcs.svg';

import { useNotificationStore } from '@/stores/notifications.js';
import { usePermissionStore } from '@/stores/permissions.js';

import ThemeSwitcher from './Utils/ThemeSwitcher.vue';

import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useRouter } from 'vue-router';
import { stopTokenWorker } from '@/utils/TokenService.js';

const confirm = useConfirm();
const toast = useToast();
const router = useRouter();

const notificationStore = useNotificationStore();
const permissionStore = usePermissionStore();

const userId = ref(null);
const roleId = ref(null);

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const initials = ref('');
const fullName = ref('');
const searchQuery = ref('');
const menuItemsAdmin = [
    {
        name: 'Пользователи',
        path: '/users',
        icon: 'pi pi-users'
    },
    {
        name: 'Роли',
        path: '/rbac',
        icon: 'pi pi-sitemap'
    },
    {
        name: 'Микросервисы',
        path: '/services',
        icon: 'pi pi-desktop'
    },
    {
        name: 'Настройка SSO',
        path: '/sso',
        icon: 'pi pi-cog'
    }
];

const menuItems = [
    {
        name: 'Заявки',
        path: '/requests',
        icon: 'pi pi-pen-to-square'
    },
]

const filteredMenuItems = computed(() => {
    return menuItemsAdmin.filter(item =>
        item.name.toLowerCase().startsWith(searchQuery.value.toLowerCase())
    );
});

const getInitials = (firstName, lastName) => {
    const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
    return initials;
};

const hasPermission = (type, action) => permissionStore.hasPermission(type, action);

const checkPermission = (path) => {
    if (path === '/rbac') {
        return hasPermission('Rbac', 'Read');
    } else if (path === '/users') {
        return hasPermission('User', 'Read');
    } else if (path === '/services') {
        return hasPermission('InfraManager', 'Read');
    } else if (path === '/sso') {
        return hasPermission('SsoResource', 'Read')
    }
    return true; // Для остальных путей
};

const confirmLogout = () => {
    confirm.require({
        message: 'Вы действительно хотите выйти?',
        header: 'Выход из аккаунта',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Отмена',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Выйти',
            severity: 'danger'
        },
        accept: () => {
            logout();
            toast.add({ severity: 'success', summary: 'Успешно', detail: 'Вы вышли из системы', life: 3000 });
        },
        reject: () => {
            toast.add({ severity: 'info', summary: 'Отклонено', detail: 'Вы отклонили выход', life: 3000 })
        }
    });
};

const logout = async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    await permissionStore.clearPermissions();
    await permissionStore.$reset();
    stopTokenWorker();
    
    router.push('/auth');
};

const showRequestsMenu = ref(false);

onBeforeMount(async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/info');
        firstName.value = response.data.firstName;
        lastName.value = response.data.lastName;
        email.value = response.data.email;

        fullName.value = `${firstName.value} ${lastName.value}`.trim();
        initials.value = getInitials(firstName.value, lastName.value);

        userId.value = response.data.id;
        roleId.value = response.data.roles[0].id;
        const statusResponse = await axiosInstance.get(`/api/infra-manager/db/users/${userId.value}/status`);
        if (statusResponse) {
            localStorage.setItem("InfraStatus", true);
        } else {
            localStorage.setItem("InfraStatus", false);
        }
        localStorage.setItem("infraManagerUserId",statusResponse.data.infraManagerUserId);
        localStorage.setItem('firstName', response.data.firstName);
        if (statusResponse.data.personalAccountUserId && statusResponse.data.infraManagerUserId) {
            showRequestsMenu.value = true;
        } else {
            showRequestsMenu.value = false;
        }
    } catch (error) {
        console.debug('Ошибка при получении информации о пользователе: ', error);
    }

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
});

onBeforeUnmount(() => {
    checkIsMobile();
    window.removeEventListener('resize', checkIsMobile);
})

const isMobile = ref(false);

const checkIsMobile = () => {
    isMobile.value = window.innerWidth > 768; // Ширина для мобильных устройств
};


</script>

<style scoped>
.profile {
    border: 2px solid transparent;
    transition: all 0.5s;
    border-radius: 12px;
    padding: 5px;
    color: var(--p-text-color);
    text-decoration: none;
}
.profile:hover {
    cursor: pointer;
    background-color: var(--p-blue-500-low-op);
}
.logoLCS {
    transition: all 0.5s;
    scale: 0.9;
}
.logoLCS:hover {
    filter: drop-shadow(0 0 0.75rem rgba(0, 0, 0, 0.3));
}
.middle {
    font-family: 'SF Pro Rounded';
    font-size: 1rem;
    line-height: normal;
    transition: all 0.5s;
}
.logout-button {
    width: 100%;
    border: 2px solid transparent;
    background-color: transparent;
    padding: 8px;
    border-radius: 12px;
    transition: all 0.5s;
    margin-bottom: 20px;
    color: var(--p-text-color);
}
.logout-button:hover {
    background-color: var(--p-blue-500-low-op);
    color: var(--p-blue-400);
}
.email {
    color: var(--p-grey-1);
}
.initials-circle {
    background-color: var(--p-blue-500);
    color: white;
    font-weight: 700;
    font-family: 'SF Pro Rounded';
    transition: all 0.5s;
}
.sidebar-container {
    height: 100vh;
    display: flex;
    box-sizing: border-box;
}
.menu {
    display: flex;
    flex-direction: column;
    gap: 8px;
    .pi {
        font-size: 1rem;
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;   
    }
}
.general {
    font-family: 'SF Pro Rounded';
    font-weight: bold;
    font-size: 16px;
    color: var(--p-text-color);
    transition: all 0.5s;
}
.menucrumb {
    font-family: 'SF Pro Rounded';
    padding-left: 48px;
    display: flex;
    align-items: center;
}
.p-badge {
    background-color: var(--p-red-500);
    font-size: 12px;
    padding: 6px;
    border-radius: 12px;
}
.menu-item {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    padding-block: 10px;
    border-radius: 12px;
    transition: all 0.5s;
    text-decoration: none;
    color: var(--p-text-color);
    border: 2px solid transparent;
}
.menu-item:hover {
    background-color: var(--p-blue-500-low-op);
    color: var(--p-color-icon-menu);
}
.active-link {
    color: var(--p-color-icon-menu);
    background-color: var(--p-blue-500-low-op);
}
.search {
    border-radius: 12px;
    transition: all 0.5s;
    font-size: 14px;
    width: 100%; 
}
.searchBar {
    margin-top: 22px;
    display: inline-block;
}
.sidebar-container.bg-image {
    position: relative;
    overflow: hidden; /* предотвращает выход размытия за границы */
}
.sidebar-container.bg-image::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    opacity: 0.5;
    height: 100%;
    background-image: url('/src/assets/backgrounds/spring.webp'); /* Укажите путь к изображению */
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    
    filter: blur(0.5px); /* Настройте степень размытия */
    z-index: -1; /* Размытие будет под контентом */
}

.rectangle {
    display: flex;
    flex-direction: column;
    background-image: linear-gradient(to bottom, var(--p-blue-100), var(--p-bg-color-2) 95%);
    width: 250px;
    padding: 1rem;
    transition: all 0.5s;
    border-right: 1px solid var(--p-grey-5);
}
</style>