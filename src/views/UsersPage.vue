<template>
    <main>
        <div class="content-wrapper">
            <div class="filters">
                <h3>Фильтры</h3>
                <div class="filter-group">
                    <InputText 
                        v-model="filters.fullName.value"
                        placeholder="ФИО"
                        class="search"
                        style="max-width: 16rem;"
                    />
                    <InputText 
                        v-model="filters.email.value"
                        placeholder="E-mail"
                        class="search"
                        style="max-width: 16rem;"
                    />
                    <Select 
                        v-model="filters.isBlocked.value" 
                        :options="statusOptions" 
                        optionLabel="label"
                        placeholder="Статус"
                        class="search"
                        style="max-width: 16rem;"
                    />
                    <MultiSelect 
                        v-model="filters.roleIds.value" 
                        :options="roles"
                        display="chip" 
                        optionLabel="title" 
                        placeholder="Роли"
                        class="search"
                        style="max-width: 16rem;"
                    />
                    <Button class="search" label="Применить фильтры" @click="applyFilters"/>
                </div>
            </div>
            <WelcomeScreen :visible="loading" />
            <DataTable
                :value="customers" 
                paginator 
                stripedRows 
                removableSort 
                scrollable
                scrollHeight="765px"
                :rows="rowsPerPage"
                :totalRecords="totalRecords"
                :globalFilterFields="['firstName', 'lastName','middleName', 'email']"
                @page="onPage"
            >
                <template #header>
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="m-0 ps-4">Список пользователей</h3>
                        <CreateUser v-if="hasPermission('User', 'Create')"/>
                    </div>
                </template>

                <template #paginatorstart>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>Всего пользователей: {{ displayedRowsCount }}</div>
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

                <Column field="firstName" header="ФИО" sortable style="max-width: 20rem;">
                    <template #body="{ data }">
                        <span class="text-nowrap">
                            {{ data.firstName }} {{ data.lastName }} {{ data.middleName }}
                        </span>
                    </template>
                </Column>
                
                <Column field="email" header="E-mail" style="min-width: 12rem;">
                    <template #body="{ data }">
                        <span class="text-nowrap">
                            {{ data.email }}
                        </span>
                    </template>
                </Column>
                <Column field="roles" header="Роли" style="max-width: 12rem;">
                    <template #body="{ data }">
                        <div class="">
                            <div class="role-label-container">
                                <!-- Показываем первую роль -->
                                <Chip v-if="data.roles.length > 0" class="role-label">
                                    <span v-if="data.roles.length > 0" class="roleType" :class="getRoleTypeClass(data.roles[0])">
                                        {{ data.roles[0].type.charAt(0) }}
                                    </span>
                                    <span>{{ data.roles[0].title }}</span>
                                </Chip>
                                
                                <!-- Если ролей больше одной, показываем Popover для дополнительных ролей -->
                                <Button v-if="data.roles.length > 1" rounded text class="p-2 ms-2" icon="pi pi-ellipsis-h" @click="(event) => togglePopover($refs['popover' + data.id], event)" />

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
                        </div>
                    </template>
                </Column>
                <Column field="isBlocked" header="Статус" style="min-width: 5rem;">
                    <template #body="{ data }">
                        <span :class="['status-label', data.isBlocked ? 'blocked' : 'active']">
                            <i class="pi" :class="data.isBlocked ? 'pi-times-circle' : 'pi-check-circle'"></i>
                            {{ data.isBlocked ? 'Заблокирован' : 'Активен' }}
                        </span>
                    </template>
                </Column>
                <Column field="change" header="" style="min-width: 5rem;" v-if="hasPermission('User', 'Update')">
                    <template #body="{ data }">
                        <UpdateUser 
                            :userId="data.id" 
                            :isBlocked="data.isBlocked" 
                            :refreshTable="fetchCustomers" 
                            :filters="filters"
                        />
                    </template>
                </Column>
                
            </DataTable>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, computed, nextTick  } from 'vue';
import axiosInstance from '@/utils/axios.js';

import { FilterMatchMode } from '@primevue/core/api';
import qs from 'qs';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import Popover from 'primevue/popover';

import CreateUser from '@/components/Users/CreateUser.vue';
import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';
import UpdateUser from '@/components/Users/UpdateUser.vue';
import { usePermissionStore } from '@/stores/permissions.js';

const customers = ref([]);
const totalRecords = ref(0);
const loading = ref(true);
const roles = ref([]);

const permissionStore = usePermissionStore();

const hasPermission = (type, action) => permissionStore.hasPermission(type, action);

const filters = ref({
    global: { value: '', matchMode: FilterMatchMode.CONTAINS },
    firstName: { value: '', matchMode: FilterMatchMode.STARTS_WITH },
    lastName: { value: '', matchMode: FilterMatchMode.STARTS_WITH },
    middleName: { value: '', matchMode: FilterMatchMode.STARTS_WITH },
    email: { value: '', matchMode: FilterMatchMode.STARTS_WITH },
    isBlocked: { value: null, matchMode: FilterMatchMode.EQUALS },
    roleIds: { value: [], matchMode: FilterMatchMode.IN },
    fullName: { value: '', matchMode: FilterMatchMode.STARTS_WITH }
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
            console.error("Popover reference is null");
        }
    });
};

// Классы для отображения ролей в зависимости от их типа
const getRoleTypeClass = (role) => {
    return role.type === 'Custom' ? 'custom-role-type' : 'default-role-type';
}

const displayedRowsCount = computed(() => {
    const start = (currentPage.value - 1) * rowsPerPage.value;
    const end = start + rowsPerPage.value;
    return customers.value.slice(start, end).length;
});

const onPage = (event) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;
}

const fetchCustomers = async (filters) => {
    loading.value = true;
    customers.value = [];
    let page = 1;
    let pageSize = rowsPerPage.value;
    let totalFetched = 0;
    let totalEntities = 0;

    while (true) {
        const params = {
            page,
            pageSize,
            fullName: filters.fullName.value || undefined,
            email: filters.email.value || undefined,
            isBlocked: filters.isBlocked.value !== null ? filters.isBlocked.value.value : undefined,
            roleIds: filters.roleIds.value.length > 0 ? filters.roleIds.value.map(role => role.id) : undefined
        };
        try {
            const response = await axiosInstance.get('/api/users', { 
                params,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                paramsSerializer: params => {
                    return qs.stringify(params, { arrayFormat: 'repeat' });
                }
                
            });
            
            const newUsers = response.data.users;
            totalEntities = response.data.countEntities;
            customers.value.push(...newUsers);
            totalFetched += newUsers.length;

            if (totalFetched >= totalEntities) {
                break;
            }

            page += 1;
        } catch (error) {
            console.error('Ошибка при получении пользователей: ', error);
            break;
        }
    }

    totalRecords.value = totalEntities;
    loading.value = false;
};

const applyFilters = () => {
    currentPage.value = 1;
    fetchCustomers(filters.value);
}

onMounted(async () => {
    await fetchCustomers(filters.value);
    await fetchRoles();
});

const fetchRoles = async () => {
    try {
        const response = await axiosInstance.get('/api/rbac/roles');
            
        roles.value = response.data;
    } catch (error) {
        console.error('Ошибка при получении ролей: ', error);
    }
};

</script>

<style scoped>

h3 {
    color: var(--p-text-color);
    transition: all 0.5s;
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
}
.search {
    border-radius: 12pt;
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
.roles-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
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
</style>