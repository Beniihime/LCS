<template>
    <WelcomeScreen :visible="loading" />
    <main>
        <div class="content-wrapper">
            <h1 class="mb-4">Настройки ролей</h1>
            <div class="statistics">
                <h2 class="statistics-title">Статистика ролей</h2>
                <div class="row row-cols-4 g-3">
                    <div class="col">
                        <div class="stat-card">
                            <div class="row `align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-people-fill"></i>
                                </div>
                                <div class="col">
                                    <span class="stat-label">Всего ролей</span>
                                </div>
                            </div>
                            <span class="stat-number">{{ roles.length }}</span>
                        </div>
                    </div>
                    <div class="col">
                        <div class="stat-card">
                            <div class="row align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-person-fill"></i>
                                </div>
                                <div class="col">
                                    <span class="stat-label">Пользовательские роли</span>
                                </div>
                            </div>
                            <span class="stat-number">{{ customRolesCount }}</span>
                        </div>
                    </div>
                    <div class="col">
                        <div class="stat-card">
                            <div class="row align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-person-fill-gear"></i>
                                </div>
                                <div class="col">
                                    <span class="stat-label">Системные роли</span>
                                </div>
                            </div>
                            <span class="stat-number">{{ systemRolesCount }}</span>
                        </div>
                    </div>
                    <div class="col">
                        <div class="stat-card">
                            <div class="row align-items-center">
                                <div class="col-auto">
                                    <i class="bi bi-person"></i>
                                </div>
                                <div class="col">
                                    <span class="stat-label">Пользователи без роли</span>
                                </div>
                            </div>
                            <span class="stat-number">{{ noRoleUsersCount }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="searchField mt-4">
                <div class="row align-items-center justify-content-between">
                    <div class="col">
                        <IconField class="searchBar">
                            <InputIcon class="pi pi-search" />
                            <InputText placeholder="Поиск" class="search" v-model="searchQuery"/>
                        </IconField>
                    </div>
                    <div class="col-auto">
                         <CreateRole :refreshRoles="fetchRoles" v-if="hasPermission('Rbac', 'Create')"/>
                    </div>
                </div>
            </div>
            <Divider class="my-4"/>
            <div class="roles-cards">
                <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    <div class="col" v-for="role in filteredRoles" :key="role.id">
                        <div class="card h-100">
                            <div class="card-body">
                                <UpdateRole 
                                    :id="role.id" 
                                    :refreshRoles="fetchRoles" 
                                    :roles="roles" 
                                    v-if="role.id !== userRole.id && role.id !== 1 && hasPermission('Rbac', 'Update')" 
                                />
                                <h5 class="card-title">{{ role.title }}</h5>
                                <p class="card-text">{{ role.description }}</p>
                                <p class="card-text"><span class="muted">Приоритет: {{ role.priority }}</span></p>
                                <div class="mt-auto row row-cols-2 justify-content-between align-items-center">
                                    <div class="col-auto">
                                        <UserCount 
                                            :roleId="role.id" 
                                            :userCount="role.userCount" 
                                            :roleType="role.type" 
                                            :roleTitle="role.title"
                                        />
                                    </div>
                                    <div class="col-auto">
                                        <div class="card-text m-0" v-if="role.id === userRole.id">Это вы</div>
                                        <div v-else class="d-flex justify-content-between">
                                            <Button 
                                                v-if="role.type === 'Custom' && hasPermission('Rbac', 'Delete')"
                                                label="Удалить" 
                                                class="delete-btn me-3"
                                                severity="danger" 
                                                @click="confirm1(role)" 
                                            />
                                            <router-link to="/role-permissions" v-if="hasPermission('Rbac', 'Update')">
                                                <Button label="Полномочия" class="perm-btn" @click.prevent="navigateToPermissions(role)"/>
                                            </router-link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

import qs from 'qs';
import axiosInstance from '@/utils/axios.js';
import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';
import UpdateRole from '@/components/Rbac/UpdateRole.vue';
import CreateRole from '@/components/Rbac/CreateRole.vue';
import UserCount from '@/components/Rbac/UserCount.vue';

import { useRoleStore } from '@/stores/roleStore';
import { usePermissionStore } from '@/stores/permissions.js';

import { useConfirm } from "primevue/useconfirm";


const loading = ref(true);
const roles = ref([]);
const users = ref([]);
const searchQuery = ref('');
const userRole = ref({id: null, title: '', type: '' });

const filteredRoles = computed(() => {
    return roles.value.filter(role => role.title.toLowerCase().startsWith(searchQuery.value.toLowerCase()));
});

const permissionStore = usePermissionStore();

const hasPermission = (type, action) => permissionStore.hasPermission(type, action);

const toast = useToast();

const fetchRoles = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
            
        roles.value = response.data.map(role => ({
            ...role,
            userCount: countUsersWithRole(role.id)
        }));
    } catch (error) {
        console.error('Ошибка при получении ролей: ', error);
    }

    loading.value = false;
};

const fetchUsers = async () => {
    let page = 1;
    let pageSize = 500;
    const params = {
        page,
        pageSize
    }
    try {
        const response = await axiosInstance.get('/api/users', {
            params,
            paramsSerializer: params => {
                return qs.stringify(params, { arrayFormat: 'repeat' });
            }
        });

        const userResponse = await axiosInstance.get('/api/users/me/info');
        userRole.value = userResponse.data.roles[0] || {};
        
        users.value = response.data.users;
    } catch (error) {
        console.error('Ошибка при получении пользователей: ', error);
    }
};

const countUsersWithRole = (roleId) => {
    return users.value.filter(user => user.roles.some(role => role.id === roleId)).length;
}

const customRolesCount = computed(() => {
    return roles.value.filter(role => role.type === 'Custom').length;
});

const systemRolesCount = computed(() => {
    return roles.value.filter(role => role.type !== 'Custom').length;
});

const noRoleUsersCount = computed(() => {
    return users.value.filter(user => user.roles.length === 0).length;
});

const deleteRole = async (role) => {
    if (role.type === 'Custom') {
        try {
            await axiosInstance.delete(`/api/rbac/roles/${role.id}`);
            roles.value = roles.value.filter(r => r.id !== role.id);
        } catch (error) {
            toast.add({ severity: 'info', summary: 'Роли', detail: 'Можно удалять только пользовательские роли', life: 3000 });
        }
    }
}

const confirm = useConfirm();
const router = useRouter();

const confirm1 = (role) => {
    confirm.require({
        message: 'Вы действительно хотите удалить роль?',
        header: 'Удаление роли',
        icon: 'pi pi-info-circle',
        rejectProps: {
            label: 'Отмена',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label:'Удалить',
            severity: 'danger'
        },
        accept: () => {
            deleteRole(role);
            toast.add({ severity: 'success', summary: 'Успешно', detail: 'Вы удалили роль', life: 3000 });
        }, 
        reject: () => {
            toast.add({ severity: 'info', summary: 'Отклонено', detail: 'Отмена действия', life: 3000 });
        }
    });
};

onMounted(async () => {
    await fetchUsers();
    await fetchRoles();
});

const roleStore = useRoleStore();

const setRoleInfo = role => {
    roleStore.setRoleInfo({
        roleId: role.id,
        roleTitle: role.title,
        roleDescription: role.description,
        roleType: role.type
    });
};
const navigateToPermissions = (role) => {
    setRoleInfo(role);
    router.push('/role-permissions');
};
</script>

<style scoped>
p {
    margin-block: 20px;
}
.roles-cards {
    width: 100%;
}
.card {
    border: none;
    border-radius: 18px;
    transition: all 0.5s;
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
.edit-btn, .delete-btn, .perm-btn {
    width: 100%;
    border-radius: 12px;
    color: white;
}
.perm-btn {
    color: white;
} 
.delete-btn:hover {
    color: white !important;
}
.muted {
    color: var(--p-grey-2);
}
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.content-wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 20px 8rem;
    overflow: hidden;
    color: var(--p-text-color);
}
.pi {
    font-size: 20pt;
}
.pi-search {
    font-size: 1rem;
}
.search {
    border-radius: 12pt;
    font-size: 16pt;
    transition: all 0.5s;
    width: 100%; 
}
.statistics {
    background: var(--p-bg-color-2);
    padding: 20px;
    border-radius: 18px;
    border: none;
    transition: all 0.5s;
}
.statistics-title {
    font-size: 1.8rem;
    margin-bottom: 20px;
    color: var(--p-text-color);
    text-align: center;
}
.stat-card {
    background: var(--p-bg-color-1);
    padding: 20px;
    border-radius: 18px;
    color: var(--p-text-color);
    transition: all 0.5s;
}
.stat-card:hover {
    scale: 1.02;
}
.stat-number {
    font-size: 2.5rem;
    font-weight: bold;
}
.stat-label {
    font-size: 1.2rem;
    opacity: 0.8;
}
.bi {
    font-size: larger;
} 

</style>