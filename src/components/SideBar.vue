<template>
    <ConfirmDialog></ConfirmDialog>
    <div class="sidebar-container" :class="['season-' + currentSeason, 'bg-image-' + currentSeason]" v-if="isMobile">
        <div class="rectangle season-overlay">
            <div v-if="debugMode" class="season-debug">
                <Button 
                    icon="pi pi-refresh"
                    @click="cycleSeason"
                    text
                    size="small"
                    v-tooltip="'Сменить сезон'"
                />
                <Tag :value="seasonName" :severity="getSeasonSeverity(currentSeason)"/>
            </div>

            <div class="d-flex align-items-center justify-content-center">
                <router-link to="/overview" class="logoLCS">
                    <Lcs />
                </router-link>
            </div>
            
            <IconField class="searchBar">
                <InputIcon class="pi pi-search" />
                <InputText 
                    id="searchQuery" 
                    name="searchQuery" 
                    class="search" 
                    v-model="searchQuery" 
                    placeholder="Поиск..." 
                />
            </IconField>

            <div class="menu mt-3">
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
                <div class="general mt-2" v-if="menuItems">Сервисы</div>
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
                <div class="general mt-2" v-if="hasPermission('User', 'Read')">Администрирование</div>
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
            
            <!-- Переключатель сезона в настройках темы -->
            <div class="season-selector" v-if="allowSeasonSelection">
                <div class="season-label">
                    <i :class="seasonIcon" class="me-2"></i>
                    <span>Сезон: {{ seasonName }}</span>
                </div>
                <Select 
                    v-model="selectedSeason"
                    :options="seasonOptions"
                    optionLabel="name"
                    optionValue="value"
                    @change="onSeasonChange"
                    class="season-select"
                    :placeholder="'Авто (' + seasonName + ')'"
                />
            </div>

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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
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

// Импортируем утилиты для сезонов
import { 
    getCurrentSeason, 
    getSeasonName, 
    getSeasonBackground, 
    getSeasonIcon,
    getSeasonGradient,
    getSeasonAccentColor 
} from '@/utils/seasons.js';

const confirm = useConfirm();
const toast = useToast();
const router = useRouter();

const notificationStore = useNotificationStore();
const permissionStore = usePermissionStore();

// Сезоны
const debugMode = ref(false); // Режим отладки для переключения сезонов
const allowSeasonSelection = ref(false); // Разрешить пользователю выбирать сезон
const currentSeason = ref(getCurrentSeason());
const selectedSeason = ref(null); // Для ручного выбора

// Опции для выбора сезона
const seasonOptions = [
    { name: 'Авто (по месяцу)', value: null },
    { name: 'Зима', value: 'winter' },
    { name: 'Весна', value: 'spring' },
    { name: 'Лето', value: 'summer' },
    { name: 'Осень', value: 'autumn' }
];

const userId = ref(null);
const roleId = ref(null);
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const initials = ref('');
const fullName = ref('');
const searchQuery = ref('');
const showRequestsMenu = ref(false);

// Вычисляемые свойства для сезона
const seasonName = computed(() => getSeasonName(currentSeason.value));
const seasonIcon = computed(() => getSeasonIcon(currentSeason.value));
const seasonBackground = computed(() => getSeasonBackground(currentSeason.value));
const seasonStyle = computed(() => ({
    '--season-gradient': getSeasonGradient(currentSeason.value),
    '--season-accent': getSeasonAccentColor(currentSeason.value)
}));

const menuItemsAdmin = [
    { name: 'Пользователи', path: '/users', icon: 'pi pi-users' },
    { name: 'Роли', path: '/rbac', icon: 'pi pi-sitemap' },
    { name: 'Микросервисы', path: '/services', icon: 'pi pi-desktop' },
    { name: 'Настройка SSO', path: '/sso/config', icon: 'pi pi-cog' },
    { name: 'Авто-Роли', path: '/autorole', icon: 'pi pi-objects-column' }
];

const menuItems = [
    { name: 'Заявки', path: '/requests', icon: 'pi pi-pen-to-square' },
];

const filteredMenuItems = computed(() => {
    return menuItemsAdmin.filter(item =>
        item.name.toLowerCase().startsWith(searchQuery.value.toLowerCase())
    );
});

// Функции
const getInitials = (firstName, lastName) => {
    const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
    return initials;
};

const hasPermission = (type, action) => permissionStore.hasPermission(type, action);

const checkPermission = (path) => {
    const permissionMap = {
        '/rbac': hasPermission('Rbac', 'Read'),
        '/users': hasPermission('User', 'Read'),
        '/services': hasPermission('InfraManager', 'Read'),
        '/sso/config': hasPermission('SsoResource', 'Read'),
        '/autorole': hasPermission('RoleAutoAssigner', 'Read')
    };
    return permissionMap[path] !== undefined ? permissionMap[path] : true;
};

// Функции для работы с сезонами
const getSeasonSeverity = (season) => {
    const severityMap = {
        'winter': 'info',
        'spring': 'success',
        'summer': 'warning',
        'autumn': 'danger'
    };
    return severityMap[season] || 'secondary';
};

const cycleSeason = () => {
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    const currentIndex = seasons.indexOf(currentSeason.value);
    const nextIndex = (currentIndex + 1) % seasons.length;
    currentSeason.value = seasons[nextIndex];
    saveSeasonPreference();
};

const onSeasonChange = (value) => {
    if (value) {
        currentSeason.value = value;
    } else {
        // Если выбран "Авто", возвращаемся к определению по месяцу
        currentSeason.value = getCurrentSeason();
    }
    saveSeasonPreference();
};

const saveSeasonPreference = () => {
    if (selectedSeason.value) {
        localStorage.setItem('seasonOverride', selectedSeason.value);
    } else {
        localStorage.removeItem('seasonOverride');
    }
};

const loadSeasonPreference = () => {
    const savedSeason = localStorage.getItem('seasonOverride');
    if (savedSeason && ['winter', 'spring', 'summer', 'autumn'].includes(savedSeason)) {
        selectedSeason.value = savedSeason;
        currentSeason.value = savedSeason;
    } else {
        selectedSeason.value = null;
        currentSeason.value = getCurrentSeason();
    }
};

// Проверка изменения месяца
let lastCheckedMonth = null;

const checkMonthChange = () => {
    const currentMonth = new Date().getMonth();
    const savedSeason = localStorage.getItem('seasonOverride');
    
    // Если пользователь не выбрал сезон вручную
    if (!savedSeason && currentMonth !== lastCheckedMonth) {
        currentSeason.value = getCurrentSeason();
        lastCheckedMonth = currentMonth;
        
        // Можно показать уведомление о смене сезона
        if (lastCheckedMonth !== null) {
            toast.add({
                severity: 'info',
                summary: 'Смена сезона',
                detail: `Теперь у вас ${seasonName.value.toLowerCase()}!`,
                life: 3000
            });
        }
    }
};

// Таймер для проверки смены месяца
let monthCheckInterval = null;

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

onMounted(async () => {
    // Загружаем предпочтения сезона
    loadSeasonPreference();
    
    // Инициализируем проверку месяца
    lastCheckedMonth = new Date().getMonth();

    try {
        const response = await axiosInstance.get('/api/users/me/info');

        firstName.value = response.data.firstName;
        lastName.value = response.data.lastName;
        email.value = response.data.email;

        fullName.value = `${firstName.value} ${lastName.value}`.trim();
        initials.value = getInitials(firstName.value, lastName.value);

        userId.value = response.data.id;
        roleId.value = response.data.roles[0].id;

        localStorage.setItem('firstName', response.data.firstName);

        axiosInstance.get(`/api/infra-manager/db/users/${userId.value}/status`)
            .then(statusResponse => {
                const data = statusResponse.data;
                localStorage.setItem("InfraStatus", true);
                localStorage.setItem("infraManagerUserId", data.infraManagerUserId);

                showRequestsMenu.value = !!(data.personalAccountUserId && data.infraManagerUserId);
            })
            .catch(() => {
                localStorage.setItem("InfraStatus", false);
                showRequestsMenu.value = false;
            })

    } catch (error) {
        console.debug('Ошибка при получении информации о пользователе: ', error);
    }

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', checkIsMobile);
    if (monthCheckInterval) {
        clearInterval(monthCheckInterval);
    }
});

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
.menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
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
    color: rgb(var(--p-color-icon-menu));
}
.active-link {
    color: rgb(var(--p-color-icon-menu));
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
/* Базовые стили остаются теми же, добавляем сезонные */
.sidebar-container {
    height: 100vh;
    display: flex;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
}

/* Сезонные классы для фона */
.sidebar-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.7;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    filter: blur(1px);
    z-index: -1;
    transition: background-image 1.5s ease-in-out, opacity 1.5s ease-in-out;
}

.sidebar-container.season-winter::before {
    background-image: url('/src/assets/backgrounds/winter.webp');
    opacity: 0.4;
}

.sidebar-container.season-spring::before {
    background-image: url('/src/assets/backgrounds/spring.webp');
    opacity: 0.4;
}

.sidebar-container.season-summer::before {
    background-image: url('/src/assets/backgrounds/summer.webp');
    opacity: 0.4;
}

.sidebar-container.season-autumn::before {
    background-image: url('/src/assets/backgrounds/autism.webp');
    opacity: 0.4;
}

/* Сезонный overlay для контента */
.rectangle.season-overlay {
    background: var(--season-gradient);
    transition: all 1s ease;
    position: relative;
    z-index: 1;
}

/* Сезонные акценты */
.season-winter .active-link,
.season-winter .menu-item:hover {
    background-color: rgba(var(--p-blue-500-rgb, 59, 130, 246), 0.1);
    color: var(--p-blue-400);
}

.season-spring .active-link,
.season-spring .menu-item:hover {
    background-color: rgba(var(--p-green-500-rgb, 40, 167, 69), 0.1);
    color: var(--p-green-400);
}

.season-summer .active-link,
.season-summer .menu-item:hover {
    background-color: rgba(var(--p-yellow-500-rgb, 255, 193, 7), 0.1);
    color: var(--p-yellow-400);
}

.season-autumn .active-link,
.season-autumn .menu-item:hover {
    background-color: rgba(var(--p-orange-500-rgb, 253, 126, 20), 0.1);
    color: var(--p-orange-400);
}

/* Акцентный цвет для текущего сезона */
.season-winter .initials-circle {
    background-color: var(--p-blue-400);
}

.season-spring .initials-circle {
    background-color: var(--p-green-400);
}

.season-summer .initials-circle {
    background-color: var(--p-yellow-500);
}

.season-autumn .initials-circle {
    background-color: var(--p-orange-400);
}

/* Элементы управления сезоном */
.season-debug {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 10;
}

.season-selector {
    margin-bottom: 1rem;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    backdrop-filter: blur(10px);
}

.season-label {
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
    color: var(--p-text-color);
    font-size: 0.9rem;
    font-weight: 500;
}

.season-select {
    width: 100%;
}

/* Анимация смены сезона */
@keyframes seasonTransition {
    0% { opacity: 0.5; }
    50% { opacity: 0.3; }
    100% { opacity: 0.7; }
}

.sidebar-container.season-changing::before {
    animation: seasonTransition 1.5s ease-in-out;
}

.rectangle {
    display: flex;
    flex-direction: column;
    background: linear-gradient(to bottom, var(--p-blue-100), var(--p-bg-color-2) 95%);
    width: 250px;
    padding: 1rem;
    transition: all 0.5s;
    border-right: 1px solid var(--p-grey-5);
}


/* Темная тема для сезонов */
.p-dark .season-winter .rectangle {
    background: linear-gradient(to bottom, rgba(25, 25, 112, 0.2), rgba(0, 0, 0, 0.8) 95%);
}

.p-dark .season-spring .rectangle {
    background: linear-gradient(to bottom, rgba(0, 100, 0, 0.2), rgba(0, 0, 0, 0.8) 95%);
}

.p-dark .season-summer .rectangle {
    background: linear-gradient(to bottom, rgba(139, 69, 19, 0.2), rgba(0, 0, 0, 0.8) 95%);
}

.p-dark .season-autumn .rectangle {
    background: linear-gradient(to bottom, rgba(160, 82, 45, 0.2), rgba(0, 0, 0, 0.8) 95%);
}
</style>