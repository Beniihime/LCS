<template>
    <div>
        <div :class="['rectangle', { 'collapsed': isCollapsed }]">
            <div class="d-flex align-items-center">
                <div class="col-auto p-0" @click="toggleSidebar">
                    <LogoSvg />
                </div>
                <div class="col-auto p-0" v-if="!isCollapsed">
                    <p class="header">Личный кабинет</p>
                </div>
            </div>
            <div class="searchBar">
                <i class="pi pi-search"></i>
                <input 
                    type="text" 
                    v-model="value" 
                    class="search" 
                    placeholder="Поиск..."
                    v-if="!isCollapsed"
                />
            </div>
            <div class="blank" v-if="isCollapsed">Управление</div>
            <div class="general" v-if="!isCollapsed">Управление</div>
            <div class="menu">
                <div class="menu-item">
                    <i class="pi pi-user"></i>
                    <div class="menucrumb" v-if="!isCollapsed">Пользователи</div>
                </div>
                <div class="menu-item">
                    <i class="pi pi-bell"></i>
                    <div class="menucrumb" v-if="!isCollapsed">Уведомления</div>
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

export default {
    name: "SideBar",
    data: function () {
        return {
            isCollapsed: false,
            value: ''
        }
    },
    components: {
        LogoSvg,
        InputText,
        SearchSvg,
        InputGroup,
        Button,
    },
    methods: {
        toggleSidebar() {
            this.isCollapsed = !this.isCollapsed;
        }
    },
}
</script>

<style scoped>
.menu {
    display: flex;
    flex-direction: column;
    gap: 10pt;
}
.general {
    font-family: 'SF Pro Rounded';
    margin-block: 20pt;
    font-size: 14pt;
    transition: width 0.5s ease-in-out;
}
.menucrumb {
    font-family: 'SF Pro Rounded';
    font-size: 14pt;
    padding-left: 40pt;
}
.pi {
    font-size: 18pt;
    position: absolute;
    left: 16pt;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;   
}
.menu-item {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 42pt;
    border-radius: 12pt;
    transition: background-color 0.2s ease-in-out;
}
.menu-item:hover {
    background-color: #E5E5EA;
}
.search {
    border-radius: 12pt;
    background: #E5E5EA;
    border: 0;
    padding-left: 48pt;
    font-size: 16pt;
    transition: all 0.5s ease-out;
    height: 36pt;
    outline: none;
    width: 100%;
    transition: all 0.5s ease-out;
}
.searchBar {
    margin-top: 20pt;
    height: 36pt;
    /* line-height: 16pt; */
    position: relative;
    display: inline-block;
}
.header {
    font-family: "SF Pro Rounded";
    font-size: 18pt;
    margin: 0 0 0 12pt;
    transition: all 0.5s ease;
}
.rectangle {
    background-color: #fff;
    box-shadow: 1pt 1pt 20pt rgba(0, 0, 0, 0.25);
    width: 256pt;
    margin: 30pt;
    padding: 20pt;
    border-radius: 18pt;
    transition: width 0.3s ease-in-out;
}
.rectangle.collapsed {
    width: 90pt;
}
.blank {
    font-family: 'SF Pro Rounded';
    margin-block: 20pt;
    font-size: 11pt;
    color: transparent;
}
</style>