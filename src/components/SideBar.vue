<template>
    <ConfirmDialog></ConfirmDialog>
    <div class="sidebar-container">
        <div class="rectangle">
            <div class="d-flex align-items-center justify-content-center">
                <router-link to="/" class="logoLCS">
                    <Lcs />
                </router-link>
            </div>
            <IconField class="searchBar">
                <InputIcon class="pi pi-search" />
                <InputText class="search" v-model="searchQuery" placeholder="Поиск..."/>
            </IconField>
            <div class="general">Администрирование</div>
            <div class="menu">
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
                            <Badge 
                                v-if="item.path === '/notif' && notificationStore.unreadCount > 0"
                                :value="notificationStore.unreadCount"
                                class="p-badge ms-3"
                            />
                        </div>
                    </router-link>
                </div>
            </div>
            <div class="split mb-4"></div>
            <ThemeSwitcher />
            <router-link class="profile" to="/profile" active-class="active-link">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <Avatar 
                            :label="initials" 
                            size="xlarge" 
                            shape="circle" 
                            class="initials-circle"
                        />
                    </div>
                    <div class="col">
                        <div class="middle">
                            {{ fullName }} 
                            <span class="email">
                                {{ email }}
                            </span>
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
import { ref, computed, onBeforeMount } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import LogoutSvg from '@/assets/logout.svg';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import axiosInstance from '@/utils/axios.js';
import ConfirmDialog from 'primevue/confirmdialog';
import Badge from 'primevue/badge';
import Avatar from 'primevue/avatar';

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
const menuItems = [
    {
        name: 'Пользователи',
        path: '/users',
        icon: 'pi pi-user'
    },
    {
        name: 'Уведомления',
        path: '/notif',
        icon: 'pi pi-bell'
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
    }
];

const filteredMenuItems = computed(() => {
    return menuItems.filter(item =>
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

onBeforeMount(async () => {
    try {
        const response = await axiosInstance.get('/api/users/me/info');
        firstName.value = response.data.firstName;
        lastName.value = response.data.lastName;
        email.value = response.data.email;

        fullName.value = `${firstName.value} ${lastName.value}`.trim();
        initials.value = getInitials(firstName.value, lastName.value);
    } catch (error) {
        console.error('Ошибка при получении информации о пользователе: ', error);
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
}
.logoLCS:hover {
    transform: scale(1.05);
}
.middle {
    font-family: 'SF Pro Rounded';
    font-size: 14pt;
    line-height: normal;
    transition: all 0.5s;
}
.logout-button {
    width: 100%;
    border: 2px solid transparent;
    background-color: transparent;
    padding: 12px 18px 12px 8px;
    border-radius: 12px;
    transition: all 0.5s;
}
.logout-button:hover {
    background-color: var(--p-blue-500-low-op);
    color: var(--p-blue-500);
}
.email {
    color: var(--p-grey-1);
}
.initials-circle {
    background-color: var(--p-button-primary-background);
    color: white;
    font-weight: 700;
    font-family: 'SF Pro Rounded';
    transition: all 0.5s;
}
.split {
    border: solid 2px var(--p-separator-opaque);
    border-radius: 2pt;
    margin-top: auto;
    transition: all 0.5s;
}
.sidebar-container {
    height: 100vh;
    display: flex;
    position: sticky;
    top: 0;
    box-sizing: border-box;
}
.menu {
    display: flex;
    flex-direction: column;
    gap: 10pt;
    .pi {
        font-size: 18pt;
        position: absolute;
        left: 16pt;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;   
    }
}
.general {
    font-family: 'SF Pro Rounded';
    font-weight: bold;
    margin-block: 20px;
    font-size: 22px;
    color: var(--p-text-color);
    transition: all 0.5s;
}
.menucrumb {
    font-family: 'SF Pro Rounded';
    font-size: 14pt;
    padding-left: 48pt;
    display: flex;
    align-items: center;
}
.p-badge {
    background-color: var(--p-red-500);
    font-size: 16px;
    padding-inline: 12px;
    border-radius: 12px;
}
.menu-item {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 42pt;
    border-radius: 12pt;
    transition: all 0.5s;
    text-decoration: none;
    color: var(--p-text-color);
    border: 2px solid transparent;
}
.menu-item:hover {
    background-color: var(--p-blue-500-low-op);
    color: var(--p-blue-500);
}
.active-link {
    color: var(--p-blue-500);
    background-color: var(--p-blue-500-low-op);
}
.search {
    border-radius: 12pt;
    font-size: 14pt;
    transition: all 0.5s;
    width: 100%; 
}
.searchBar {
    margin-top: 20pt;
    display: inline-block;
}
.rectangle {
    display: flex;
    flex-direction: column;
    background-color: var(--p-bg-color-2);
    width: 256pt;
    margin: 10pt;
    padding: 18pt;
    border-radius: 18pt;
    transition: all 0.5s;
    border: 2px solid var(--p-grey-4);
}
</style>