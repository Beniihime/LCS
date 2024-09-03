<template>
    <main>
        <div class="content-wrapper">
            <div v-if="!filtersSet">
                <h3 class="mb-3">Введите параметры для загрузки данных</h3>
                <div class="filter-group">
                    <InputText 
                        v-model="currentPageInput"
                        placeholder="Страница"
                        class="search"
                    />
                    <InputText 
                        v-model="rowsPerPageInput"
                        placeholder="Количество строк"
                        class="search"
                    />
                    <Button class="search" label="Применить" @click="applyMandatoryFilters"/>
                </div>
            </div>
            <div v-else>
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
                    :rows="rowsPerPage"
                    :globalFilterFields="['firstName', 'lastName','middleName', 'email']"
                >
                    <template #header>
                        <div class="d-flex justify-content-between align-items-center">
                            <h3 class="m-0 ps-4">Список пользователей</h3>
                            <CreateUser />
                        </div>
                    </template>

                    <template #footer>
                        <div class="d-flex justify-content-end">
                            Всего пользователей: {{ displayedRowsCount  }}
                        </div>
                    </template>

                    <template #empty>Не найдено.</template>
                    <template #loading>Данные загружаются. Подождите.</template>

                    <Column field="firstName" header="Имя" sortable style="min-width: 12rem;">
                        <template #body="{ data }">
                            <span class="text-nowrap">
                                {{ data.firstName }}
                            </span>
                        </template>
                    </Column>
                    <Column field="lastName" header="Фамилия" sortable  style="min-width: 12rem;">
                        <template #body="{ data }">
                            <span class="text-nowrap">
                                {{ data.lastName }}
                            </span>
                        </template>
                    </Column>
                    <Column field="middleName" header="Отчество" sortable  style="min-width: 12rem;">
                        <template #body="{ data }">
                            <span class="text-nowrap">
                                {{ data.middleName }}
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
                    <Column field="roles" header="Роли" style="min-width: 12rem;">
                        <template #body="{ data }">
                            <div class="roles-grid">
                                <Chip class="py-1 px-1">
                                    <span v-for="role in data.roles" :key="role.id" class="roleType">{{ role.type.charAt(0) }}</span>
                                    <span v-for="role in data.roles" :key="role.id" :class="'role-' + role.type.toLowerCase()" class="role-label">
                                        {{ role.title }}
                                    </span>
                                    <span v-if="data.roles.length === 0" class="role-label">
                                        Нет ролей
                                    </span>
                                </Chip>
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
                    <Column field="change" header="" style="min-width: 5rem;">
                        <template #body="{ data }">
                            <UpdateUser :userId="data.id" :isBlocked="data.isBlocked" :refreshTable="fetchCustomers" :filters="filters"/>
                        </template>
                    </Column>
                    
                </DataTable>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
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

const customers = ref([]);
const totalRecords = ref(0);
const loading = ref(true);
const filtersSet = ref(false);
const roles = ref([]);

const currentPageInput = ref(1);
const rowsPerPageInput = ref(10);

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

const statusOptions = [
    { label: "Все", value: null },
    { label: 'Активен', value: false },
    { label: 'Заблокирован', value: true },
];

const displayedRowsCount = computed(() => {
    const startRecord = (currentPage.value - 1) * rowsPerPage.value;
    return Math.min(customers.value.length - startRecord, rowsPerPage.value);
});

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

const applyMandatoryFilters = () => {
    currentPage.value = parseInt(currentPageInput.value) || 1;
    rowsPerPage.value = parseInt(rowsPerPageInput.value) || 10;
    filtersSet.value = true;

    fetchCustomers(filters.value);
};

const applyFilters = () => {
    fetchCustomers(filters.value);
}

onMounted(async () => {
    if (filtersSet.value) {
        fetchCustomers(filters.value);
    }

    try {
        const response = await axiosInstance.get('/api/rbac/roles');
        roles.value = response.data;
    } catch (error) {
        console.error('Ошибка при получении ролей: ', error);
    }
});

</script>

<script>


import CreateUser from '@/components/CreateUser.vue';
import WelcomeScreen from '@/components/WelcomeScreen.vue';
import UpdateUser from '@/components/UpdateUser.vue';

export default {
    name: 'Users',
    components: {
        CreateUser,
        WelcomeScreen,
        UpdateUser
    }
}
</script>

<style scoped>

h3 {
    color: var(--p-text-color);
    transition: all 0.5s ease;
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
    font-size: 14pt;
    transition: all 0.5s ease-out;
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
    background-color: #30D158;
}
.roles-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
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
.role-label {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 500;
}
.role-admin {
    background-color: #8c00ff;
}
.role-superuser {
    background-color: #ffb007;
}
.role-none {
    background-color: #888;
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
</style>