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
                        />
                        <MultiSelect 
                            v-model="filters.roleIds.value" 
                            :options="roleOptions" 
                            optionLabel="title" 
                            placeholder="Роли"
                            class="search"
                        />
                        <Button class="search" label="Применить фильтры" @click="applyFilters"/>
                    </div>
                </div>
                <DataTable
                    :value="customers" 
                    paginator 
                    :rows="rowsPerPage"
                    dataKey="id"
                    :totalRecords="totalRecords"
                    :first="firstRecord"
                    @page="onPage"
                    :loading="loading"
                    :globalFilterFields="['firstName', 'lastName','middleName', 'email']"
                    scrollable
                    scrollHeight="flex"
                >
                    <template #header>
                        <div class="d-flex justify-content-between align-items-center">
                            <h3 class="mb-2">Список пользователей</h3>
                        </div>
                    </template>

                    <template #footer>
                        <div class="d-flex justify-content-end">
                            Всего пользователей: {{ displayedRowsCount  }}
                        </div>
                    </template>

                    <template #empty>Не найдено.</template>
                    <template #loading>Данные загружаются. Подождите.</template>

                    <Column field="firstName" header="Имя" style="min-width: 12rem;">
                        <template #body="{ data }">
                            <span class="text-nowrap">
                                {{ data.firstName }}
                            </span>
                        </template>
                    </Column>
                    <Column field="lastName" header="Фамилия" style="min-width: 12rem;">
                        <template #body="{ data }">
                            <span class="text-nowrap">
                                {{ data.lastName }}
                            </span>
                        </template>
                    </Column>
                    <Column field="middleName" header="Отчество" style="min-width: 12rem;">
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
                                <span
                                    v-for="role in data.roles"
                                    :key="role.id"
                                    class="role-label"
                                    :class="'role-' + role.type.toLowerCase()"
                                >
                                    {{ role.title }}
                                </span>
                                <span v-if="data.roles.length === 0" class="role-label role-none">
                                    Нет ролей
                                </span>
                            </div>
                        </template>
                    </Column>
                    <Column field="isBlocked" header="Статус" style="min-width: 8rem;">
                        <template #body="{ data }">
                            <span :class="['status-label', data.isBlocked ? 'blocked' : 'active']">
                                <i class="pi" :class="data.isBlocked ? 'pi-times-circle' : 'pi-check-circle'"></i>
                                {{ data.isBlocked ? 'Заблокирован' : 'Активен' }}
                            </span>
                        </template>
                    </Column>
                    
                </DataTable>
            </div>
        </div>
    </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { FilterMatchMode } from '@primevue/core/api';
import qs from 'qs';

const customers = ref([]);
const totalRecords = ref(0);
const loading = ref(true);
const filtersSet = ref(false);

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
    fullName: { value: '', matchMode: FilterMatchMode.CONTAINS }
});

const currentPage = ref(1);
const rowsPerPage = ref(10);
const firstRecord = ref(0);

const statusOptions = [
    { label: "Все", value: null },
    { label: 'Активен', value: false },
    { label: 'Заблокирован', value: true },
];

const roleOptions = [
    { id: 1, type: 'SuperUser', title: 'Суперпользователь' },
    { id: 2, type: 'Admin', title: 'Администратор' },
    { id: 25, type: 'Custom', title: 'Сотрудник' },
    { id: 26, type: 'Custom', title: 'Студент' }
];

const displayedRowsCount = computed(() => {
    return Math.min(rowsPerPageInput.value, totalRecords.value);
});

const fetchCustomers = async (page = 1, pageSize = 10, filters) => {
    loading.value = true;

    const params = {
        page,
        pageSize,
        fullName: filters.fullName.value || undefined,
        email: filters.email.value || undefined,
        isBlocked: filters.isBlocked.value !== null ? filters.isBlocked.value.value : undefined,
        roleIds: filters.roleIds.value.length > 0 ? filters.roleIds.value.map(role => role.id) : undefined
    };

    console.log(params);

    try {
        const response = await axios.get('/api/users', { 
            params,
            headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            },
            paramsSerializer: params => {
                return qs.stringify(params, { arrayFormat: 'repeat' });
            }
            
        });
        customers.value = response.data.users;
        totalRecords.value = response.data.countEntities;

        firstRecord.value = (page - 1) * pageSize;
    } catch (error) {
        console.error('Ошибка при получении пользователей: ', error);
    } finally {
        loading.value = false;
    }
};

const applyMandatoryFilters = () => {
    currentPage.value = parseInt(currentPageInput.value) || 1;
    rowsPerPage.value = parseInt(rowsPerPageInput.value) || 10;
    filtersSet.value = true;

    fetchCustomers(currentPage.value, rowsPerPage.value, filters.value);
};

const applyFilters = () => {
    fetchCustomers(currentPage.value, rowsPerPage.value, filters.value);
}

const onPage = (event) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;
    firstRecord.value = (currentPage.value - 1) * rowsPerPage.value;
    fetchCustomers(currentPage.value, rowsPerPage.value, filters.value);
}

onMounted(() => {
    if (filtersSet.value) {
        fetchCustomers(currentPage.value, rowsPerPage.value, filters.value);
    }
});

</script>

<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup'; 
import Row from 'primevue/row';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import MultiSelect from 'primevue/multiselect';
import Button from 'primevue/button';

export default {
    name: 'Users',
    components: {
        DataTable,
        Column, 
        ColumnGroup,
        Row,
        IconField,
        InputIcon,
        InputText,
        Select,
        MultiSelect
    }
}
</script>
<style>

</style>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100vh;
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
.role-label {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12pt;
    color: white;
    font-weight: 500;
    background-color: #007bff;
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