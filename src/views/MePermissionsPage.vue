<template>
    <main>
        <div class="permissions-wrapper">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2 class="m-0">Мои полномочия</h2>
            </div>
            
            <div v-for="resource in filteredResources" :key="resource.id" class="mt-3">
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
                    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-4 g-2">
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
                                        <div v-if="permission.enabled">
                                            <Tag severity="success" icon="pi pi-lock-open" style="padding: 7px;"/>
                                        </div>
                                        <div v-else>
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
    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axiosInstance from '@/utils/axios.js';

const searchQuery1 = ref('');
const loading = ref(false);
const allPermissions = ref([]);
const rolePermissions = ref([]);

const route = useRoute();

const roleId = route.query.r;

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
        const response = await axiosInstance.get(`/api/rbac/roles/${roleId}/permissions`);
        rolePermissions.value = response.data.resourcesWithPermissions; // Получаем полномочия роли
        updatePermissionsWithRoleStatus();
        console.debug(roleId);
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

onMounted(() => {
    fetchAllPermissions();
    fetchRolePermissions();
});
</script>

<style scoped>
.permissions-wrapper {
    padding: 10px;
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
    transition: transform 0.3s ease;
    background-color: var(--p-grey-7);
    color: var(--p-text-color);
    display: flex;
    border: none;
    flex-direction: column;
    justify-content: space-between;
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
    background-color: var(--p-grey-6);
    transition: all 0.5s;
    box-sizing: border-box;
    position: relative;
}
.permission-item:hover {
    filter: drop-shadow(0 0 0.5rem rgba(0, 0, 0, 0.3));
}
.permission-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 5px;
}
.permission-title {
    font-size: 1.1rem;
    font-weight: bold;
    margin: 0;
    max-width: calc(100% - 120px);
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
h2 {
    margin-bottom: 5px;
    font-size: 28px;
    font-weight: bold;
}
</style>