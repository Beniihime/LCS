<template>
    <Toast />
    <main>
        <div class="content-wrapper">
            <h1 class="mb-4">Настройки ролей</h1>
            <router-link class="dPerms" to="/me-permissions">
                <div class="row ps-4 w-100">
                    <div class="col-auto">
                        <i class="pi pi-users icon"></i>
                    </div>
                    <div class="col d-flex align-items-center">
                        <div>
                            <span>Мои полномочия</span>
                            <Chip class="ms-4">
                                <span :class="['roleType', userRole.type === 'Custom' ? 'custom-role-type' : '']">
                                    {{ userRole.type.charAt(0) }}
                                </span>
                                <span class="role-label">
                                    {{ userRole.title }}
                                </span>
                            </Chip>
                        </div>
                    </div>
                    <div class="col-auto d-flex align-items-center">
                        <i class="pi pi-angle-right"></i>
                    </div>
                </div>
            </router-link>
            <div class="searchField mt-4">
                <div class="row align-items-center">
                    <div class="col">
                        <IconField class="searchBar">
                            <InputIcon class="pi pi-search" />
                            <InputText placeholder="Поиск" class="search" v-model="searchQuery"/>
                        </IconField>
                    </div>
                    <div class="col-auto">
                         <CreateRole />
                    </div>
                </div>
            </div>
            <Divider class="my-4"/>
            <WelcomeScreen :visible="loading" />
            <div class="roles-cards">
                <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                    <div class="col" v-for="role in filteredRoles" :key="role.id">
                        <div class="card h-100">
                            <div class="card-body">
                                <button v-tooltip.left="{ value: 'Скопировать ID', showDelay: 300, hideDelay: 300 }" class="copyId" @click="copyRoleId(role.id)">
                                    <ID />
                                </button>
                                <UpdateRole :id="role.id" :title="role.title" :description="role.description" :priority="role.priority"/>
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
                                                v-if="role.type === 'Custom'" 
                                                label="Удалить" 
                                                class="delete-btn me-3"
                                                severity="danger" 
                                                outlined 
                                                @click="confirm1(role)" 
                                            />
                                            <router-link to="/role-permissions">
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
import qs from 'qs';
import axiosInstance from '@/utils/axios.js';
import WelcomeScreen from '@/components/WelcomeScreen.vue';
import UpdateRole from '@/components/Rbac/UpdateRole.vue';
import CreateRole from '@/components/Rbac/CreateRole.vue';
import UserCount from '@/components/Rbac/UserCount.vue';

import { useRoleStore } from '@/stores/roleStore';

import ID from '@/assets/Id.svg';

import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import Chip from 'primevue/chip';
import Divider from 'primevue/divider';

const loading = ref(true);
const roles = ref([]);
const users = ref([]);
const searchQuery = ref('');
const userRole = ref({title: '', type: '' });

const filteredRoles = computed(() => {
    return roles.value.filter(role => role.title.toLowerCase().startsWith(searchQuery.value.toLowerCase()));
});

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

const deleteRole = async (role) => {
    if (role.type === 'Custom') {
        try {
            await axiosInstance.delete(`/api/rbac/roles/${role.id}`, {
                headers: {
                    'Authorization': `Bearer ${ localStorage.getItem('accessToken') }`
                }
            });
            roles.value = roles.value.filter(r => r.id !== role.id);
        } catch (error) {
            alert('Можно удалять только пользовательские роли.')
        }
    }
}

const confirm = useConfirm();
const toast = useToast();
const router = useRouter();

const confirm1 = (role) => {
    confirm.require({
        message: 'Вы действительно хотите удалить роль?',
        header: 'Удаление роли',
        icon: 'pi pi-info-circle',
        rejectLabel: 'Отмена',
        rejectProps: {
            label: 'Cancel',
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

const copyRoleId = async (roleId) => {
    try {
        await navigator.clipboard.writeText(roleId);
        toast.add({ severity: 'success', summary: 'Успешно', detail: 'ID скопирован', life: 3000 });
    } catch (error) {
        console.error('Ошибка при копировании ID:', error);
        toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Не удалось скопировать ID', life: 3000 });
    }
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
    border-radius: 18px;
    transition: transform 0.3s ease;
    background-color: var(--p-bg-color-2);
    color: var(--p-text-color);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
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
}
.perm-btn {
    color: white;
} 
.delete-btn:hover {
    color: var(--p-text-color);
    background-color: var(--p-red);
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
    padding: 20px;
    overflow: hidden;
    color: var(--p-text-color);
}
.dPerms {
    display: flex;
    text-decoration: none;
    justify-content: start;
    padding: 20px;
    border-radius: 18px;
    background-color: var(--p-grey-5);
    outline: none;
    border: none;
    transition: background-color 0.3s ease;
    font-size: 16pt;
    color: var(--p-text-color);
}

.dPerms:hover {
    background-color: var(--p-grey-4);
}

.pi {
    font-size: 20pt;
}
.pi-search {
    font-size: 1rem;
}
.icon {
    padding: 12px;
    border-radius: 50%;
    background-color: var(--p-grey-3);
}
.search {
    border-radius: 12pt;
    font-size: 16pt;
    transition: all 0.5s ease-out;
    width: 100%; 
}
.copyId {
    margin-top: 10px;
    border-radius: 12px;
    color: white;
    position: absolute;
    top: 10px;
    right: 70px;
    border: none;
}
.copyId:hover {
    background-color: transparent;
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
</style>