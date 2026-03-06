<template>
    <GenericTable
        ref="tableRef"
        title="Сотрудники"
        icon="pi pi-users"
        :columns="columns"
        :fetch-function="fetchEmployees"
        :initial-filters="initialFilters"
        :default-columns="defaultColumns"
        @create="openCreateDialog"
        @edit="openEditDialog"
        @delete="openDeleteDialog"
    >
        <template #body-fullName="{ data }">
            {{ data.lastName }} {{ data.firstName }} {{ data.middleName || '' }}
        </template>
        
        <template #body-email="{ data }">
            {{ data.email || '-' }}
        </template>
        
        <template #body-inn="{ data }">
            {{ data.inn || '-' }}
        </template>
        
        <template #body-snils="{ data }">
            {{ data.snils || '-' }}
        </template>
        
        <template #body-jobPositions="{ data }">
            <div class="job-positions-tags">
                <Tag 
                    v-for="jobPosition in data.jobPositions" 
                    :key="jobPosition.id"
                    :value="jobPosition.title"
                    severity="secondary"
                    class="job-position-tag"
                />
            </div>
        </template>
        
        <template #body-createdAt="{ data }">
            {{ formatDate(data.createdAt) }}
        </template>
        
        <template #body-changedAt="{ data }">
            {{ formatDate(data.changedAt) }}
        </template>
        
        <template #body-methodOfCreation="{ data }">
            <Tag :value="data.methodOfCreation" 
                :severity="getMethodSeverity(data.methodOfCreation)" />
        </template>

        <!-- Слот для фильтра по должностям (select) -->
        <template #filter-jobPositions="{ column, filters, onInput }">
            <Select 
                v-model="filters.jobPositionId"
                :options="jobPositionOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="column.placeholder"
                @change="onInput"
            />
        </template>
    </GenericTable>

    <CreateEmployee 
        v-model:visible="showCreateDialog" 
        @created="refreshTable"
    />
    <UpdateEmployee 
        @edited="refreshTable" 
        :employee="selectedItem" 
        v-model:visible="showEditDialog" 
    />
    <DeleteEmployee 
        @deleted="refreshTable" 
        :employee="selectedItem" 
        v-model:visible="showDeleteDialog"
    />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from "@/utils/axios.js";
import GenericTable from "@/components/Microservice/Rating/Tables/common/GenericTable.vue";
import CreateEmployee from "@/components/Microservice/Rating/Methods/Employees/CreateEmployee.vue";
import UpdateEmployee from "@/components/Microservice/Rating/Methods/Employees/UpdateEmployee.vue";
import DeleteEmployee from "@/components/Microservice/Rating/Methods/Employees/DeleteEmployee.vue";
import { getMethodSeverity, formatDate } from "@/utils/tableHelpers.js";

// Рефы
const tableRef = ref();
const selectedItem = ref(null);

// Диалоги
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);

// Конфигурация таблицы
const columns = [
    { field: 'fullName', header: 'ФИО', filterable: true, filterType: 'text', placeholder: 'Поиск по ФИО...' },
    { field: 'email', header: 'Email', filterable: false },
    { field: 'inn', header: 'ИНН', filterable: false },
    { field: 'snils', header: 'СНИЛС', filterable: false },
    { field: 'jobPositions', header: 'Должности', filterable: true, filterField: 'jobPositionId', filterType: 'select', placeholder: 'Все должности' },
    { field: 'createdAt', header: 'Создано', filterable: false },
    { field: 'changedAt', header: 'Изменено', filterable: false },
    { field: 'methodOfCreation', header: 'Способ создания', filterable: false }
];

const defaultColumns = ['fullName', 'email', 'jobPositions', 'inn', 'snils'];
const initialFilters = { fullName: '', jobPositionId: null };

// Опции для фильтра по должностям
const jobPositionOptions = ref([{ label: 'Все', value: null }]);

// Загрузка должностей для фильтра
const loadJobPositionsForFilter = async () => {
    try {
        const { data } = await axiosInstance.get('/api/rating/job-positions');
        jobPositionOptions.value = [
            { label: 'Все', value: null },
            ...data.map(jp => ({ label: jp.title, value: jp.id }))
        ];
    } catch (error) {
        console.error('Ошибка при загрузке должностей для фильтра: ', error);
    }
};

// API функции
const fetchEmployees = async (request) => {
    const { data } = await axiosInstance.post('/api/rating/employees/paginated', request);
    return { data };
};

// Обработчики
const openCreateDialog = () => {
    showCreateDialog.value = true;
};

const openEditDialog = (item) => {
    selectedItem.value = item;
    showEditDialog.value = true;
};

const openDeleteDialog = (item) => {
    selectedItem.value = item;
    showDeleteDialog.value = true;
};

const refreshTable = () => {
    tableRef.value?.fetchData();
};

onMounted(async () => {
    await loadJobPositionsForFilter();
});
</script>

<style scoped>
/* Стили для тегов должностей */
.job-positions-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

.job-position-tag {
    font-size: 0.813rem;
    padding: 0.375rem 0.75rem;
    font-weight: 500;
}
</style>