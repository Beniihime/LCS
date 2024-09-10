<template>
    <main>
        <WelcomeScreen :visible="loading" />
        <div class="permissions-wrapper">
            <div class="mb-4 d-flex justify-content-between align-items-center">
                <h1 class="m-0">Мои полномочия</h1>
                <Button class="back-btn m-0" icon="pi pi-arrow-left" label="Назад" @click="goBack" text/>
            </div>
            <div class="m-0">
                <span style="font-size: 1.5rem;">Моя роль:</span>
                <span>
                    <Chip class="ms-4">
                        <span class="roleType" :class="['roleType', userRole.type === 'Custom' ? 'custom-role-type' : '']">
                            {{ userRole.type.charAt(0) }}
                        </span>
                        <span class="role-label">
                            {{ userRole.title }}
                        </span>
                    </Chip>
                </span>
            </div>
            
            <div class="searchField my-4">
                <div class="row align-items-center">
                    <div class="col">
                        <IconField class="searchBar">
                            <InputIcon class="pi pi-search" />
                            <InputText placeholder="Поиск" class="search" v-model="searchQuery"/>
                        </IconField>
                    </div>
                </div>
            </div>
            <Divider />
            <div v-if="!loading">
                <div v-for="resource in filteredResources" :key="resource.id" class="role-section">
                    <h3 class="role-title">{{ resource.title }}<span class="resourse-type ms-4">{{ resource.type }}</span></h3>
                    <p class="role-description">{{ resource.description }}</p>
                    <div v-for="permission in resource.permissions" :key="permission.id" class="permission-item">
                        <div class="permission-info">
                            <h3 class="permission-title">{{ permission.title }}</h3>
                            <p class="permission-description">{{ permission.description }}</p>
                        </div>
                        <ToggleSwitch 
                            v-model="permission.enabled" 
                            @update:modelValue="togglePermission(resource.id, permission.id, $event)"
                        />
                    </div>
                    <Divider />
                </div>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axiosInstance from '@/utils/axios.js';
import WelcomeScreen from '@/components/WelcomeScreen.vue';

import ToggleSwitch from 'primevue/toggleswitch';
import Divider from 'primevue/divider';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Chip from 'primevue/chip';

const searchQuery = ref('');

const loading = ref(true);
const resources = ref([]);
const userRole = ref({ title: '', type: ''});

const router = useRouter();

const goBack = () => {
    router.back();
};

const fetchPermissions = async () => {
    try {
        const [permissionsResponse, userResponse] = await Promise.all([
            axiosInstance.get('/api/users/me/permissions'),
            axiosInstance.get('/api/users/me/info')
        ]);

        const rolePermissions = permissionsResponse.data;
        const userRoleData = userResponse.data.roles[0] || {};

        // Создаем словарь разрешений
        const permissionStatusMap = new Map();
        rolePermissions.forEach(resource => {
            resource.permissions.forEach(permission => {
                permissionStatusMap.set(permission.id, true);
            });
        });

        resources.value = rolePermissions.map(resource => ({
            ...resource,
            permissions: resource.permissions.map(permission => ({
                ...permission,
                enabled: permissionStatusMap.has(permission.id)
            }))
        }));

        userRole.value = userRoleData;
    } catch (error) {
        console.error('Ошибка при загрузке полномочий:', error);
    } finally {
        loading.value = false;
    }
};

const togglePermission = async (resourceId, permissionId, isActive) => {
    try {
        const endpoint = `/api/users/me/permissions/${permissionId}`;
        if (isActive) {
            await axiosInstance.patch(endpoint, { isActive });
        } else {
            await axiosInstance.delete(endpoint);
        }
        updatePermissionStatus(resourceId, permissionId, isActive);
    } catch (error) {
        console.error('Ошибка при переключении полномочий: ', error);
    }
};

const updatePermissionStatus = (resourceId, permissionId, isActive) => {
    const resource = resources.value.find(r => r.id === resourceId);
    if (resource) {
        const permission = resource.permissions.find(p => p.id === permissionId);
        if (permission) {
            permission.enabled = isActive;
        }
    }
};

const filteredResources = computed(() => {
    if (!searchQuery.value) {
        return resources.value;
    }

    return resources.value.map(resource => ({
        ...resource,
        permissions: resource.permissions.filter(permission =>
            permission.title.toLowerCase().startsWith(searchQuery.value.toLowerCase()) ||
            permission.description.toLowerCase().startsWith(searchQuery.value.toLowerCase())
        )
    })).filter(resource => resource.permissions.length > 0);
});

onMounted(async () => {
    await fetchPermissions();
})


</script>

<style scoped>
.permissions-wrapper {
    padding: 20px;
    color: var(--p-text-color);
}
.role-section {
    margin-bottom: 20px;
}

.role-description {
    font-size: 1rem;
    margin-bottom: 1rem;
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
.search {
    border-radius: 12pt;
    font-size: 16pt;
    transition: all 0.5s ease;
    width: 100%; 
}
.back-btn {
    border-radius: 18px;
    font-size: 1.25rem;
}
.roleType {
    background-color: #007bff;
    border-radius: 50%;
    font-size: 20px;
    color: white;
    width: 30px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
}
.custom-role-type {
    background-color: #6c2bb4;
}
.role-label {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 500;
}
.resourse-type {
    color: var(--p-grey-1);
    font-size: 1.5rem;
}
</style>