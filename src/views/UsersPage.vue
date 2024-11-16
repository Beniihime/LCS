<template>
    <div class="content">
        <div class="content-wrapper">                
            <WelcomeScreen :visible="loading" />
            <DataTable
                v-if="!loading && customers.length"
                v-model:filters="filters"
                :value="customers" 
                paginator 
                filterDisplay="row" 
                scrollable
                stripedRows
                :rows="rowsPerPage"
                :rowClass="rowClass"
                @row-click="(event) => navigateToProfile(event.data.id)"
                :totalRecords="totalRecords"
                @page="onPage"
                :globalFilterFields="['fullName', 'email', 'roles', 'status']"
            >
                <template #header>
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="m-0 ps-4">Список пользователей</h3>
                        <CreateUser v-if="hasPermission('User', 'Create')"/>
                    </div>
                </template>

                <template #paginatorstart>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>Всего пользователей: {{ totalRecords }}</div>
                    </div>
                </template>

                <template #paginatorend>
                    <div class="d-flex align-items-center">
                        <span>Показать</span>
                        <Select 
                            v-model="rowsPerPage"
                            :options="rowsPerPageOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="search mx-1 px-1"
                        />
                        <span>строк</span>
                    </div>
                </template>

                <template #empty>Не найдено.</template>
                <template #loading>Данные загружаются. Подождите.</template>

                <Column field="fullName" header="ФИО" :showFilterMenu="false" style="min-width: 20rem;">
                    <template #body="{ data }">
                        <span class="text-nowrap">
                            {{ data.firstName }} {{ data.lastName }} {{ data.middleName }}
                        </span>
                    </template>
                    <template #filter="{ filterModel, filterCallback }">
                        <InputText 
                            v-model="filterModel.value" 
                            placeholder="Поиск по ФИО" 
                            @input="filterCallback()"
                            autocomplete="off"
                        />
                    </template>
                </Column>
                
                <Column field="email" header="E-mail" :showFilterMenu="false" style="min-width: 12rem;">
                    <template #body="{ data }">
                        <span class="text-nowrap">
                            {{ data.email }}
                        </span>
                    </template>
                    <template #filter="{ filterModel, filterCallback }">
                        <InputText 
                            v-model="filterModel.value" 
                            placeholder="Поиск по E-mail" 
                            @input="filterCallback()"
                            autocomplete="off"
                        />
                    </template>
                </Column>
                <Column field="roleIds" header="Роли" :showFilterMenu="false" style="min-width: 12rem;">
                    <template #body="{ data }">
                        <div class="role-label-container">
                            <!-- Показываем первую роль -->
                            <Chip v-if="data.roles.length > 0" class="role-label">
                                <span class="roleType" :class="getRoleTypeClass(data.roles[0])">
                                    {{ data.roles[0].type.charAt(0) }}
                                </span>
                                <span>{{ data.roles[0].title }}</span>
                            </Chip>
                            
                            <!-- Если ролей больше одной, показываем Popover для дополнительных ролей -->
                            <Button v-if="data.roles.length > 1" rounded text class="p-2 ms-2" icon="pi pi-ellipsis-h" @click.stop="(event) => togglePopover($refs['popover' + data.id], event)" />

                            <Popover :ref="'popover' + data.id">
                                <div class="roles-container">
                                    <div v-for="(role, index) in data.roles.slice(1)" :key="role.id" class="role-list-item">
                                        <Chip class="role-label">
                                            <span class="roleType" :class="getRoleTypeClass(role)">
                                                {{ role.type.charAt(0) }}
                                            </span>
                                            <span>{{ role.title }}</span>
                                        </Chip>
                                    </div>
                                </div>
                                
                            </Popover>
                        </div>
                    </template>
                    <template #filter="{ filterModel, filterCallback }">
                        <MultiSelect 
                            v-model="filterModel.value"
                            :options="roles"
                            optionLabel="title"
                            optionValue="title"
                            :maxSelectedLabels="1"
                            placeholder="Выберите роли"
                            @change="() => { 
                                filterCallback();
                                console.log('Selected Role IDs:', filterModel.value); // Выводим выбранные роли для отладки
                            }"
                        />
                    </template>
                </Column>
                <Column field="isBlocked" header="Статус" :showFilterMenu="false" style="min-width: 4rem;">
                    <template #body="{ data }">
                        <Tag 
                            :severity="data.isBlocked ? 'danger' : 'success'" 
                            :value="data.isBlocked ? 'Заблокирован' : 'Активен'" 
                            :icon="data.isBlocked ? 'pi pi-times' : 'pi pi-check'"
                        />
                    </template>
                    <template #filter="{ filterModel, filterCallback }">
                        <Select 
                            v-model="filterModel.value" 
                            :options="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Выберите статус" 
                            @change="filterCallback()" 
                        />
                    </template>
                </Column>
                
            </DataTable>
            
            <Skeleton v-else width="100%" height="100%" class="skeleton-table" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { FilterMatchMode } from '@primevue/core/api';
import qs from 'qs';
import { useRouter } from 'vue-router';

import CreateUser from '@/components/Users/CreateUser.vue';
import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';
import UpdateUser from '@/components/Users/UpdateUser.vue';
import { usePermissionStore } from '@/stores/permissions.js';

const router = useRouter();

const customers = ref([]);
const totalRecords = ref(0);
const loading = ref(true);
const roles = ref([]);

const userPriority = ref(null);

const permissionStore = usePermissionStore();
const hasPermission = (type, action) => permissionStore.hasPermission(type, action);


const filters = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    fullName: { value: '', matchMode: FilterMatchMode.CONTAINS },
    email: { value: '', matchMode: FilterMatchMode.STARTS_WITH },
    roleIds: { value: null, matchMode: FilterMatchMode.CONTAINS },
    isBlocked: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const currentPage = ref(1);
const rowsPerPage = ref(10);

const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
];

const statusOptions = [
    { label: "Все", value: null },
    { label: 'Активен', value: false },
    { label: 'Заблокирован', value: true },
];

const togglePopover = (popoverRef, event) => {
    nextTick(() => {
        if (popoverRef) {
            popoverRef.toggle(event);
        } else {
            console.debug("Popover reference is null");
        }
    });
};

const rowClass = (data) => {
    return [{ 'pointer': !data.removed }];
};

const updateUserRef = ref(null); // Ссылка на дочерний компонент UpdateRole
// const openDialog = (id) => { nextTick(() => { updateUserRef.value?.fetchUserData(id); }); };

const navigateToProfile = (userId) => {
    router.push({ 
        name: 'Profile', 
        query: { id: userId } 
    });
};

// Классы для отображения ролей в зависимости от их типа
const getRoleTypeClass = (role) => {
    return role.type === 'Custom' ? 'custom-role-type' : 'default-role-type';
}

const onPage = async (event) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;
}

const fetchCustomers = async () => {
    try {
        const response = await axiosInstance.get('/api/users', { 
            params: {
                page: 1,
                pageSize: rowsPerPage.value * 2,
            },
            paramsSerializer: params => {
                return qs.stringify(params, { arrayFormat: 'repeat' });
            }
        });
        
        customers.value = response.data.users.map((user) => ({
            ...user,
            fullName: `${user.firstName} ${user.lastName} ${user.middleName}`,
            roleIds: user.roles.map(role => role.title),
        }));
        totalRecords.value = response.data.countEntities;      
    } catch (error) {
        console.debug('Ошибка при получении пользователей: ', error);
    }
};


onMounted(async () => {
    loading.value = true;
    await fetchCustomers(); // Дождёмся загрузки пользователей
    await fetchRoles(); // Дождёмся загрузки ролей
    nextTick(() => {
        loading.value = false;
    });
});

const fetchRoles = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
        const allRoles = response.data;            
        // Фильтруем роли по приоритету
        roles.value = allRoles
            .filter(role => role.priority > userPriority.value)
    } catch (error) {
        console.debug('Ошибка при получении ролей: ', error);
    }
};

</script>

<style scoped>

h3 {
    color: var(--p-text-color);
    transition: all 0.5s;
}
.content {
    display: flex;
    flex-direction: column;
    height: 100dvh;
    box-sizing: border-box;
}
.content-wrapper {
    flex-grow: 1;
    align-content: center;
    padding: 10px;
    height: 100%;
    color: var(--p-text-color);
    transition: all 0.5s;
}
.search {
    border-radius: 12px;
    font-size: 18px;
    transition: all 0.5s;
}
.text-nowrap {
    white-space: nowrap;
}
.status-label {
    display: inline-block;
    padding: 5px 10px;
    border-radius: 12px;
    font-weight: 400;
    font-size: 12pt;
    color: white;
    text-align: center;
}
.blocked {
    background-color: #FF453A;
}
.active {
    border: 1px solid var(--p-green-500);
    color: var(--p-green-500);
}
.filters {
    margin-bottom: 20px;
}
.filter-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
}
.roles-container {
    display: flex;
    flex-direction: column;
}
.role-list-item {
    margin-bottom: 8px; /* Отступ между элементами */
}

.role-label {
    font-size: 1rem;
    font-weight: 500;
}
.roleType {
    background-color: var(--p-blue-500);
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
    background-color: var(--p-purple-500);
}
.skeleton-table {
  border-radius: 12px;
  background-color: var(--p-grey-3);
}
</style>