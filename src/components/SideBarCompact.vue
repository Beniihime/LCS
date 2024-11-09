<template>
    <ConfirmDialog></ConfirmDialog>
    <div class="sidebar-container">
        <div class="rectangle">
            <div class="d-flex align-items-center justify-content-center">
                <div class="logoLCS">
                    <Lcs />
                </div>
            </div>
            
            <div class="menu mt-4 mb-5">
                <router-link to="/overview" class="menu-item" active-class="active-link" v-tooltip="'Главная'">
                    <i class="pi pi-home"></i>
                </router-link>
                <router-link to="/notif" class="menu-item" active-class="active-link" v-tooltip="'Уведомления'">
                    <i class="pi pi-bell"></i>
                </router-link>
            </div>
            <div class="menu mb-3">
                <div v-for="item in menuItems">
                    <router-link 
                        :key="item.path" 
                        :to="item.path" 
                        class="menu-item" 
                        active-class="active-link"
                        v-if="checkPermission(item.path) && showRequestsMenu"
                        v-tooltip="item.name"
                    >
                        <!-- <OverlayBadge v-if="item.path === '/notif' && notificationStore.unreadCount > 0" :value="notificationStore.unreadCount">
                            
                        </OverlayBadge> -->
                        <i :class="item.icon"></i>
                    </router-link>
                </div>
            </div>
            <div class="menu">
                <div v-for="item in filteredMenuItems">
                    <router-link 
                        :key="item.path" 
                        :to="item.path" 
                        class="menu-item" 
                        active-class="active-link"
                        v-if="checkPermission(item.path)"
                        v-tooltip="item.name"
                    >
                        
                        <i :class="item.icon"></i>
                        
                    </router-link>
                </div>
            </div>
            <Divider style="margin-top: auto;"/>

            <ThemeSwitcher :isSideBarCollapse="true" />

            <router-link class="profile" to="/profile" active-class="active-link" v-tooltip="'Профиль'">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <Avatar 
                            :label="initials" 
                            size="xlarge" 
                            shape="circle" 
                            class="initials-circle"
                        />
                    </div>
                </div>
            </router-link>
            <div class="row mt-3">
                <div class="col">
                    <button @click="confirmLogout()" class="logout-button" v-tooltip="'Выйти'">
                        <div class="d-flex align-items-center justify-content-center">
                            <LogoutSvg />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onBeforeMount } from 'vue';
import LogoutSvg from '@/assets/logout.svg';
import axiosInstance from '@/utils/axios.js';

import Lcs from '@/assets/logo/lcs.svg';

import { useNotificationStore } from '@/stores/notifications.js';
import { usePermissionStore } from '@/stores/permissions.js';

import ThemeSwitcher from './Utils/ThemeSwitcher.vue';

import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useRouter } from 'vue-router';

const confirm = useConfirm();
const toast = useToast();
const router = useRouter();

const notificationStore = useNotificationStore();
const permissionStore = usePermissionStore();

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
        icon: 'pi pi-user'
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

        const userId = response.data.id;
        const statusResponse = await axiosInstance.get(`/api/infra-manager/db/users/${userId}/status`);
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
    
});
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
    scale: 0.7;
}
.logoLCS:hover {
    filter: drop-shadow(0 0 0.75rem rgba(0, 0, 0, 0.5));
}
.middle {
    font-family: 'SF Pro Rounded';
    font-size: 1.1rem;
    line-height: normal;
    transition: all 0.5s;
}
.logout-button {
    width: 100%;
    border: 2px solid transparent;
    background-color: transparent;
    padding: 12px 18px 12px 14px;
    border-radius: 12px;
    transition: all 0.5s;
    margin-bottom: 20px;
}
.logout-button:hover {
    background-color: var(--p-blue-500-low-op);
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
    justify-content: center;
    align-self: center;
    gap: 12px;
    .pi {
        font-size: 1.25rem;
        position: absolute;
        top: 28%;
        pointer-events: none;   
    }
}
.menu-item {
    position: relative;
    display: flex;
    place-content: center;
    width: 55px;
    height: 55px;
    border-radius: 12px;
    transition: all 0.5s;
    text-decoration: none;
    color: var(--p-text-color);
    border: 2px solid transparent;
}
.menu-item:hover {
    background-color: var(--p-blue-500-low-op);
    color: var(--p-text-color);
    .pi {
        color: var(--p-color-icon-menu);
    }
}
.active-link {
    color: var(--p-color-icon-menu);
    background-color: var(--p-blue-500-low-op);
}
.rectangle {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 110px;
    padding: 1.25rem;
    transition: all 0.5s;
    border-right: 2px solid var(--p-grey-4);
}
.rectangle:before {
  content: ' ';
  display: block;
  position: absolute;
  left: 0;
  filter: blur(1px);
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0.8;
  background-image: url('../assets/Exclude.png');
  background-color: var(--p-bg-color-2);
  background-repeat: no-repeat;
  background-position: 50% 0;
  background-size: contain;
  z-index: -1;
}
</style>