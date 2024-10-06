<template>
    <main>
        <WelcomeScreen :visible="loading" />
        <div class="permissions-wrapper">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="m-0">Полномочия роли</h1>
                <Button class="back-btn m-0" icon="pi pi-arrow-left" label="Назад" @click="goBack" text />
            </div>
            <div class="searchField my-4">
                <div class="row align-items-center">
                    <div class="col">
                        <IconField class="searchBar">
                            <InputIcon class="pi pi-search" />
                            <InputText placeholder="Поиск" class="search" v-model="searchQuery" />
                        </IconField>
                    </div>
                </div>
            </div>
            <Divider />
            <h3>Выбранная роль</h3>
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">{{ roleStore.roleTitle }}</h5>
                    <p class="card-text">{{ roleStore.roleType }}</p>
                    <p class="card-text">{{ roleStore.roleDescription }}</p>
                </div>
            </div>
            <Divider />
            <div v-for="resource in filteredResources" :key="resource.id" class="mt-4">
                <h3 class="resource-title">{{ resource.title }}<span class="resourse-type ms-4">{{ resource.type }}</span></h3>
                <div class="resource-info">
                    <p class="resource-description">{{ resource.description }}</p>
                </div>
                <div v-for="permission in resource.permissions" :key="permission.id" class="permission-item">
                    <div class="permission-info">
                        <h3 class="permission-title">{{ permission.title }}</h3>
                        <p class="permission-description">{{ permission.description }}</p>
                    </div>
                    <ToggleSwitch
                        v-model="permission.enabled"
                        @update:model-value="togglePermission(roleStore.roleId, permission.id, $event)"
                    />
                </div>
                <Divider />
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useRoleStore } from '@/stores/roleStore';
import axiosInstance from '@/utils/axios.js';
import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';

import ToggleSwitch from 'primevue/toggleswitch';
import Divider from 'primevue/divider';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';

const searchQuery = ref('');
const loading = ref(false);
const roleStore = useRoleStore();
const router = useRouter();
const allPermissions = ref([]);
const rolePermissions = ref([]);


const fetchAllPermissions = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/permissions');
        allPermissions.value = response.data; // Получаем все полномочия системы
    } catch (error) {
        console.error('Ошибка при загрузке полномочий:', error);
    }
};

const fetchRolePermissions = async () => {
    try {
        const response = await axiosInstance.get(`/api/rbac/roles/${roleStore.roleId}/permissions`);
        rolePermissions.value = response.data.resourcesWithPermissions; // Получаем полномочия роли
        updatePermissionsWithRoleStatus();
    } catch (error) {
        console.error('Ошибка при загрузке полномочий роли:', error);
    } finally {
        loading.value = false; // Скрываем экран загрузки
    }
};

const updatePermissionsWithRoleStatus = () => {
    // Создаем словарь полномочий для быстрого доступа
    const rolePermissionMap = new Map();
    rolePermissions.value.forEach(resource => {
        resource.permissions.forEach(permission => {
            rolePermissionMap.set(permission.id, true);
        });
    });

    // Обновляем полномочия системы на основании словаря
    allPermissions.value.forEach(resource => {
        resource.permissions.forEach(permission => {
            permission.enabled = rolePermissionMap.has(permission.id);
        });
    });
};

const goBack = () => {
    router.back();
};

const togglePermission = async (roleId, permissionId, isActive) => {
    try {
        const endpoint = `/api/rbac/roles/${roleId}/permissions/${permissionId}`;
        if (isActive) {
            await axiosInstance.patch(endpoint); // Обновляем статус полномочия
            window.dispatchEvent(new CustomEvent('toast', {
                detail: { 
                    severity: 'success', 
                    summary: 'Роли', 
                    detail: 'Вы добавили полномочие для роли',
                    userName: `${ roleStore.roleTitle }`
                }
            }));
        } else {
            await axiosInstance.delete(endpoint); // Удаляем полномочие
            window.dispatchEvent(new CustomEvent('toast', {
                detail: { 
                    severity: 'success', 
                    summary: 'Роли', 
                    detail: 'Вы удалили полномочие для роли',
                    userName: `${ roleStore.roleTitle }` 
                }
            }));
        }
        updatePermissionStatus(permissionId, isActive);
    } catch (error) {
        console.error('Ошибка при переключении полномочий: ', error);
    }
};

const updatePermissionStatus = (permissionId, isActive) => {
    allPermissions.value.forEach(resource => {
        const permission = resource.permissions.find(p => p.id === permissionId);
        if (permission) {
            permission.enabled = isActive; // Обновляем состояние полномочия в локальном массиве
        }
    });
};

const filteredResources = computed(() => {
    // Фильтруем ресурсы по параметру isCustomizable
    const customizableResources = allPermissions.value.map(resource => ({
        ...resource,
        permissions: resource.permissions.filter(permission => permission.isCustomizable)
    }));

    if (!searchQuery.value) {
        return customizableResources; // Если нет запроса, возвращаем отфильтрованные ресурсы
    }

    // Фильтрация полномочий по названию или описанию
    return customizableResources.map(resource => ({
        ...resource,
        permissions: resource.permissions.filter(permission =>
            permission.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            permission.description.toLowerCase().includes(searchQuery.value.toLowerCase())
        )
    })).filter(resource => resource.permissions.length > 0); // Возвращаем только те ресурсы, которые содержат полномочия после фильтрации
});

onMounted(async () => {
    await fetchAllPermissions();
    await fetchRolePermissions();
});
</script>

<style scoped>
.permissions-wrapper {
    padding: 20px;
    color: var(--p-text-color);
}
.search {
    border-radius: 12pt;
    font-size: 16pt;
    transition: all 0.5s;
    width: 100%; 
}
.back-btn {
    border-radius: 18px;
    font-size: 1.25rem;
}
.card {
    border-radius: 18px;
    transition: transform 0.3s ease;
    background-color: var(--p-bg-color-2);
    color: var(--p-text-color);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
}
.card:hover {
    transform: scale(1.02);
}
.card-body {
    padding: 28px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}
.card-title {
    font-size: 1.5rem;
    margin-bottom: 10px;
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-text-color);
}
.card-text {
    font-size: 1.2rem;
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-grey-1);
    margin-top: 5px;
}
.resourse-type {
    color: var(--p-grey-1);
    font-size: 1.5rem;
}
.resource-description {
    color: var(--p-grey-1);
}
.permission-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-radius: 18px;
    background-color: var(--p-grey-6);
    margin-bottom: 10px;
}
.permission-info {
    display: flex;
    flex-direction: column;
}
.permission-title {
    font-size: 1.2rem;
}
.permission-description {
    font-size: 0.9rem;
    color: var(--p-grey-1);
}
</style>