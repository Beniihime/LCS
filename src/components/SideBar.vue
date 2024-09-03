<template>
    <Toast />
    <ConfirmDialog></ConfirmDialog>
    <div class="sidebar-container">
        <div class="rectangle">
            <div class="d-flex align-items-center">
                <router-link to="/" class="col-auto p-0 home">
                    <LogoSvg class="home1" />
                </router-link>
                <div class="col-auto p-0">
                    <p class="header">Личный кабинет</p>
                </div>
            </div>
            <IconField class="searchBar">
                <InputIcon class="pi pi-search" />
                <InputText class="search" v-model="searchQuery" placeholder="Поиск..."/>
            </IconField>
            <div class="general">Управление</div>
            <div class="menu">
                <router-link 
                    v-for="item in filteredMenuItems"
                    :key="item.path"
                    :to="item.path"
                    class="menu-item"
                    active-class="active-link"
                >
                    <i :class="item.icon"></i>
                    <div class="menucrumb">{{ item.name }}</div>
                </router-link>
            </div>
            <div class="split mb-4"></div>
            <ThemeSwitcher />
            <div class="profile">
                <div class="row d-flex align-items-center justify-content-around px-0">
                    <div class="col">
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
                    <div class="col ps-1">
                        <button @click="confirm1()" class="logout-button">
                            <LogoutSvg />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import LogoSvg from '@/assets/logo1.svg';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import LogoutSvg from '@/assets/logout.svg';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import axiosInstance from '@/utils/axios.js';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';

import ThemeSwitcher from './ThemeSwitcher.vue';

import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useRouter } from 'vue-router';

const confirm = useConfirm();
const toast = useToast();
const router = useRouter();

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
        getInitials(firstName) {
            const initials = `${firstName[0] || ''}`.toUpperCase();
            return initials;
        },
    },
}
</script>

<style module>
.themeSwitcher {
    width: 100%;
    border-radius: 18px;
}
</style>

<style scoped>

.middle {
    font-family: 'SF Pro Rounded';
    font-size: 14pt;
    line-height: normal;
    color: var(--p-text-color);
    transition: all 0.5s ease;
}
.logout-button {
    outline: none;
    border: none;
    background-color: transparent;
    padding: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
}
.logout-button:hover {
    background-color: var(--p-bg-color-3);
}
.logout-button:active {
    background-color: var(--p-grey-2);
}
.email {
    color: var(--p-grey-1);
}
.initials-circle {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 44pt;
    height: 44pt;
    background-color: var(--p-button-primary-background);
    color: white;
    border-radius: 50%;
    font-size: 26pt;
    font-weight: 700;
    font-family: 'SF Pro Rounded';
}
.split {
    border: solid 2pt var(--p-separator-opaque);
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
    font-weight: 600;
    margin-block: 20pt;
    font-size: 14pt;
    color: var(--p-text-color);
}
.menucrumb {
    font-family: 'SF Pro Rounded';
    font-size: 14pt;
    padding-left: 40pt;
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
}
.menu-item:hover {
    background-color: var(--p-button-primary-background);
    color: white;
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
    background-color: var(--p-button-primary-background);
    box-shadow: 1pt 1pt 5pt rgba(0, 0, 0, 0.25);
    color: white;
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
    box-shadow: 1pt 1pt 20pt rgba(0, 0, 0, 0.25);
    width: 256pt;
    margin: 10pt;
    padding: 18pt;
    border-radius: 18pt;
    transition: all 0.5s ease;
    border: 3px solid var(--p-grey-4);
}
</style>