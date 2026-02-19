<template>
    <main>
        <div class="permissions-wrapper">
            <div class="d-flex justify-content-between align-items-center">
                <h2 class="m-0">Полномочия роли</h2>
                <Button class="back-btn m-0" icon="pi pi-arrow-left" label="Назад" @click="goBack" text />
            </div>
            <div class="searchField my-3">
                <div class="row align-items-center">
                    <div class="col">
                        <IconField class="searchBar">
                            <InputIcon class="pi pi-search" />
                            <InputText id="search" name="search" placeholder="Поиск..." class="search" v-model="searchQuery1" />
                        </IconField>
                    </div>
                    <div class="col-auto">
                        <div class="card h-100">
                            <div class="card-body">
                                <Chip class="role-label">
                                    <span class="roleType" :class="getRoleTypeClass()">
                                        {{ roleStore.roleType.charAt(0) }}
                                    </span>
                                    <span>{{ roleStore.roleTitle }}</span>
                                </Chip>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Divider />
            <Transition name="content-fade" mode="out-in">
                <div v-if="loading" key="role-permissions-skeleton" class="permissions-skeleton">
                    <div v-for="idx in 3" :key="idx" class="mt-4">
                        <Skeleton width="20rem" height="1.5rem" class="mb-2" />
                        <Skeleton width="36rem" height="1rem" class="mb-3" />
                        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-3">
                            <div class="col" v-for="permIdx in 8" :key="permIdx">
                                <div class="permission-item h-100">
                                    <Skeleton width="65%" height="1.2rem" class="mb-2" />
                                    <Skeleton width="100%" height="0.95rem" class="mb-2" />
                                    <Skeleton width="84%" height="0.95rem" />
                                </div>
                            </div>
                        </div>
                        <Divider />
                    </div>
                </div>
                <div v-else key="role-permissions-content">
                    <div v-for="resource in filteredResources" :key="resource.id" class="mt-4">
                        <div class="row align-items-center">
                            <div class="col-auto pe-0">
                                <h4>{{ resource.title }}</h4>
                            </div>
                            <div class="col-auto pe-0"><Tag :value="resource.type" severity="info" class="mx-2"/></div>
                            <div class="col-auto ps-0">
                                <Tag 
                                    v-if="!resource.permissions.some(permission => permission.isCustomizable)" 
                                    value="Нет регулируемых полномочий" 
                                    severity="warn" 
                                    icon="pi pi-exclamation-triangle"
                                />
                            </div>
                        </div>
                        <div class="resource-info">
                            <p class="resource-description">{{ resource.description }}</p>
                        </div>
                        <div class="w-100">
                            <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-3">
                                <div v-for="permission in resource.permissions" :key="permission.id" class="col">
                                    <div class="permission-item h-100">
                                        <div class="permission-header">
                                            <h3 class="permission-title">{{ permission.title }}</h3>
                                            <div class="d-flex">
                                                <Button class="me-2" text style="padding: 1px;" @click="openDialog(permission.id)">
                                                    <i class="pi pi-info-circle" style="font-size: 20px;"/>
                                                </Button>
                                                <Dialog 
                                                    v-model:visible="infoDialogVisible[permission.id]"
                                                    modal
                                                    :header="permission.title" 
                                                    :style="{ 'min-width': '20rem', 'max-width': '40rem' }"
                                                >
                                                    <p>{{ permission.description }}</p>
                                                    <Tag 
                                                        v-if="permission.isCustomizable" 
                                                        value="Регулируемое" 
                                                        severity="success" 
                                                        icon="pi pi-cog"
                                                    />
                                                    <Tag 
                                                        v-else 
                                                        value="Не регулируемое" 
                                                        severity="warn" 
                                                        icon="pi pi-exclamation-triangle"
                                                    />
                                                </Dialog>

                                                <div v-if="permission.isCustomizable" class="d-flex">
                                                    <ToggleSwitch v-model="permission.enabled" @update:model-value="togglePermission(roleStore.roleId, permission.id, $event)">
                                                        <template #handle>
                                                            <i :class="['pi', { 'pi-check': permission.enabled, 'pi-times': !permission.enabled }]" style="font-size: 8px; font-weight: 900;"></i>
                                                        </template>
                                                    </ToggleSwitch>
                                                </div>
                                                <div v-else-if="permission.enabled" class="d-flex">
                                                    <Tag severity="success" icon="pi pi-lock-open"/>
                                                </div>
                                                <div v-else class="d-flex">
                                                    <Tag severity="danger" icon="pi pi-lock" style="padding: 7px;"/>
                                                </div>
                                            </div>
                                        </div>
                                        <p class="permission-description">{{ permission.description }}</p>
                                    </div>
                                    
                                </div>
                            </div>
                        </div>
                    
                        <Divider />
                    </div>
                </div>
            </Transition>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useRoleStore } from '@/stores/roleStore';
import axiosInstance from '@/utils/axios.js';

const searchQuery1 = ref('');
const loading = ref(false);
const roleStore = useRoleStore();
const router = useRouter();
const allPermissions = ref([]);
const rolePermissions = ref([]);

const infoDialogVisible = ref({});

const initializeDialogVisibility = () => {
    allPermissions.value.forEach(resource => {
        resource.permissions.forEach(permission => {
            infoDialogVisible.value[permission.id] = false;
        });
    });
};

const openDialog = (permissionId) => {
    infoDialogVisible.value[permissionId] = true; // Открываем диалог
};


const fetchAllPermissions = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/permissions');
        allPermissions.value = response.data; // Получаем все полномочия системы
    } catch (error) {
        console.debug('Ошибка при загрузке полномочий:', error);
    }
};

const fetchRolePermissions = async () => {
    try {
        const response = await axiosInstance.get(`/api/rbac/roles/${roleStore.roleId}/permissions`);
        rolePermissions.value = response.data.resourcesWithPermissions; // Получаем полномочия роли
        updatePermissionsWithRoleStatus();
    } catch (error) {
        console.debug('Ошибка при загрузке полномочий роли:', error);
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
        console.debug('Ошибка при переключении полномочий: ', error);
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
    const customizableResources = allPermissions.value.map(resource => ({
        ...resource,
    }));

    if (!searchQuery1.value) {
        return customizableResources; // Если нет запроса, возвращаем отфильтрованные ресурсы
    }

    // Фильтрация полномочий по названию или описанию
    return customizableResources.map(resource => ({
        ...resource,
        permissions: resource.permissions.filter(permission =>
            permission.title.toLowerCase().includes(searchQuery1.value.toLowerCase()) ||
            permission.description.toLowerCase().includes(searchQuery1.value.toLowerCase())
        )
    })).filter(resource => resource.permissions.length > 0); // Возвращаем только те ресурсы, которые содержат полномочия после фильтрации
});

// Классы для отображения ролей в зависимости от их типа
const getRoleTypeClass = () => {
    return roleStore.roleType === 'Custom' ? 'custom-role-type' : 'default-role-type';
}

onMounted(async () => {
    loading.value = true;
    await fetchAllPermissions();
    await fetchRolePermissions();
    initializeDialogVisibility();
    loading.value = false;
});
</script>

<style scoped>
.p-chip {
    background: transparent;
}
.permissions-wrapper {
    position: relative;
    padding: 1.25rem 8rem;
    color: var(--p-text-color);
}
.search {
    border-radius: 12px;
    transition: all 0.5s;
    width: 100%; 
}
.back-btn {
    border-radius: 12px;
    font-size: 1.25rem;
}
.card {
    border-radius: 12px;
    background-color: var(--p-grey-7);
    color: var(--p-text-color);
    display: flex;
    border: none;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    transition: all 0.5s;
}
.card-body {
    padding: 5px;
}
.card-title {
    font-size: 1.5rem;
    margin-bottom: 10px;
    font-family: 'SF Pro Rounded';
    color: var(--p-text-color);
}
.card-text {
    font-size: 1rem;
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-grey-1);
    margin: 0;
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
    flex-direction: column;
    padding: 18px;
    border-radius: 12px;
    background-color: var(--p-grey-7);
    transition: all 0.5s;
    position: relative;
    box-sizing: border-box;
}
.permission-item:hover {
    filter: drop-shadow(0 0 0.5rem rgba(0, 0, 0, 0.3));
}
.permission-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}
.permission-title {
    font-size: 1.1rem;
    font-weight: bold;
    margin: 0;
    max-width: calc(100% - 70px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.permission-description {
    font-size: 14px;
    color: var(--p-grey-1);
    margin-bottom: 8px 0 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}
.switch-container {
    position: absolute;
    top: 15px;
    right: 15px;
}
.role-label {
    font-size: 1rem;
}
.roleType {
    background-color: var(--p-blue-500);
    border-radius: 50%;
    font-size: 20px;
    color: white;
    width: 28px;
    height: 28px;
    display: flex;
    justify-content: center;
    align-items: center;
}
.custom-role-type {
    background-color: var(--p-purple-500);
}
</style>
