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
            <div class="general">Управление</div>
            <div class="menu">
                <div v-for="item in filteredMenuItems">
                    <router-link 
                        :key="item.path" 
                        :to="item.path" 
                        class="menu-item" 
                        active-class="active-link"
                        v-if="
                            item.path === '/rbac' ? hasPermission('Rbac', 'Read') : true && 
                            item.path === '/users' ? hasPermission('User', 'Read') : true
                        "
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
            <router-link class="profile" to="/profile">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <div class="initials-circle">
                            {{ initials }}
                        </div>
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
                    <button @click="confirm1()" class="logout-button">
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
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import LogoutSvg from '@/assets/logout.svg';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import axiosInstance from '@/utils/axios.js';
import ConfirmDialog from 'primevue/confirmdialog';
import Badge from 'primevue/badge';

import Lcs from '@/assets/logo/lcs.svg';

import { useNotificationStore } from '@/stores/notifications.js';
import { usePermissionStore } from '@/stores/permissions.js';

import ThemeSwitcher from './ThemeSwitcher.vue';

import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useRouter } from 'vue-router';

const confirm = useConfirm();
const toast = useToast();
const router = useRouter();

const notificationStore = useNotificationStore();
const permissionStore = usePermissionStore();

const hasPermission = (type, action) => permissionStore.hasPermission(type, action);

const confirm1 = () => {
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
}

const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    router.push('/auth');
}

</script>

<script>

export default {
    name: "SideBar",
    data: function () {
        return {
            initials: '',
            fullName: '',
            firstName: '',
            lastName: '',
            email: '',
            searchQuery: '',
            menuItems: [
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
                }
            ]
        };
    },
    computed: {
        filteredMenuItems() {
            return this.menuItems.filter(item =>
                item.name.toLowerCase().includes(this.searchQuery.toLowerCase())
            );
        }
    },
    async mounted() {
        try {
            const response = await axiosInstance.get('/api/users/me/info');
            this.firstName = response.data.firstName;
            this.lastName = response.data.lastName;
            this.email = response.data.email;

            this.fullName = `${this.firstName} ${this.lastName}`.trim();
            this.initials = this.getInitials(this.firstName, this.lastName);
        } catch (error) {
            console.error('Ошибка при получении информации о пользователе: ', error);
        }
    },
    methods: {
        getInitials(firstName, lastName) {
            const initials = `${ firstName[0] + lastName[0] || '' }`.toUpperCase();
            return initials;
        },
    },
}
</script>

<style scoped>
.profile {
    border: 2px solid transparent;
    transition: all 0.5s ease;
    border-radius: 12px;
    padding: 5px;
    text-decoration: none;
}
.profile:hover {
    border: 2px solid var(--p-blue-500);
    cursor: pointer;
    background-color: var(--p-blue-500-low-op);
}
.logoLCS {
    transition: transform 0.5s ease;
}
.logoLCS:hover {
    transform: scale(1.05);
}
.middle {
    font-family: 'SF Pro Rounded';
    font-size: 14pt;
    line-height: normal;
    color: var(--p-text-color);
    transition: all 0.5s ease;
}
.logout-button {
    width: 100%;
    border: 2px solid transparent;
    background-color: transparent;
    padding: 12px 18px 12px 8px;
    border-radius: 12px;
    transition: all 0.3s ease;
}
.logout-button:hover {
    background-color: var(--p-blue-500-low-op);
    color: var(--p-blue-500);
}
.email {
    color: var(--p-grey-1);
}
.initials-circle {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    margin: 0;
    width: 60px;
    height: 60px;
    background-color: var(--p-button-primary-background);
    color: white;
    border-radius: 50%;
    font-size: 30px;
    font-weight: 700;
    font-family: 'SF Pro Rounded';
}
.split {
    border: solid 2px var(--p-separator-opaque);
    border-radius: 2pt;
    margin-top: auto;
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
    transition: all 0.2s ease-in;
    text-decoration: none;
    color: var(--p-text-color);
    border: 2px solid transparent;
}
.menu-item:hover {
    background-color: var(--p-blue-500-low-op);
    color: var(--p-blue-500);
}
.home {
    position: relative;
    display: inline-block;
    
}
.home::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 60px;
    height: 60px;
    background-image: url('@/assets/back.svg');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease-in;
    z-index: 10;
}
.home:active::after {
    background-image: url('@/assets/back-fill.svg');
}
.home1 {
    transition: filter 0.2s ease-in;
}
.home1:hover {
    filter: brightness(50%);
}
.home:hover::after {
    opacity: 1;
}
.menu-item.active-link {
    box-shadow: 1px 1px 5px rgba(0, 0, 0, 0.25);
    color: var(--p-blue-500);
    border: 2px solid var(--p-blue-500);
}
.search {
    border-radius: 12pt;
    font-size: 14pt;
    transition: all 0.5s ease-out;
    width: 100%; 
}
.searchBar {
    margin-top: 20pt;
    display: inline-block;
}
.header {
    font-family: "SF Pro Rounded";
    font-size: 18pt;
    font-weight: 600;
    margin: 0 0 0 12pt;
    transition: all 0.5s ease;
    color: var(--p-text-color);
}
.rectangle {
    display: flex;
    flex-direction: column;
    background-color: var(--p-bg-color-2);
    width: 256pt;
    margin: 10pt;
    padding: 18pt;
    border-radius: 18pt;
    transition: all 0.5s ease;
    border: 2px solid var(--p-grey-4);
}
</style>