<template>
    <div class="sidebar-container">
        <div class="rectangle">
            <div class="d-flex align-items-center">
                <router-link to="/" class="col-auto p-0 home">
                    <LogoSvg />
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
                    <div class="col">
                        <button @click="logout" class="logout-button">
                            <LogoutSvg />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import LogoSvg from '@/assets/logo1.svg';
import SearchSvg from '@/assets/search.svg';
import InputText from 'primevue/inputtext';
import InputGroup from 'primevue/inputgroup';
import Button from 'primevue/button';
import LogoutSvg from '@/assets/logout.svg';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

import axios from 'axios';

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
            const response = await axios.get('/api/users/me/info', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
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
        logout() {
            localStorage.removeItem('accessToken');
            this.$router.push('/auth');
        }
    },
    components: {
        LogoSvg,
        InputText,
        SearchSvg,
        InputGroup,
        Button,
        LogoutSvg,
        IconField,
        InputIcon
    },
}
</script>

<style scoped>
.middle {
    font-family: 'SF Pro Rounded';
    font-size: 14pt;
    line-height: normal;
}
.logout-button {
    outline: none;
    border: none;
    background-color: transparent;
}
.email {
    color: #8E8E93;
}
.initials-circle {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 44pt;
    height: 44pt;
    background-color: #2570B1;
    color: white;
    border-radius: 50%;
    font-size: 26pt;
    font-weight: 700;
    font-family: 'SF Pro Rounded';
}
.split {
    border: solid 2pt #E5E5EA;
    border-radius: 2pt;
    margin-top: auto;
}
.sidebar-container {
    height: 100vh;
    display: flex;
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
    color: inherit;
}
.menu-item:hover {
    background-color: #2570B1;
    box-shadow: 1pt 1pt 5pt rgba(0, 0, 0, 0.25);
    color: white;
}
.home:hover {
    filter: brightness(80%);
}
.menu-item.active-link {
    background-color: #2570B1;
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
}
.rectangle {
    display: flex;
    flex-direction: column;
    background-color: #fff;
    box-shadow: 1pt 1pt 20pt rgba(0, 0, 0, 0.25);
    width: 256pt;
    margin: 30pt;
    padding: 20pt;
    border-radius: 18pt;
    transition: width 0.3s ease-in-out;
}
</style>