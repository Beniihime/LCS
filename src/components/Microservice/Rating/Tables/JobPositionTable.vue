<template>
    <GenericTable
        ref="tableRef"
        title="Должности"
        icon="pi pi-sitemap"
        :columns="columns"
        :fetch-function="fetchJobPositions"
        :initial-filters="initialFilters"
        :default-columns="defaultColumns"
        @create="openCreateDialog"
        @edit="openEditDialog"
        @delete="openDeleteDialog"
    >
        <template #body-title="{ data }">
            {{ data.title }}
        </template>
        
        <template #body-department="{ data }">
            <div class="department-tag">
                <Tag :value="data.department.number" severity="secondary" />
                <Tag :value="data.department.name" />
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
    </GenericTable>

    <CreateJobPosition 
        v-model:visible="showCreateDialog" 
        @created="refreshTable"
    />
    <UpdateJobPosition 
        @edited="refreshTable" 
        :jobPosition="selectedItem" 
        v-model:visible="showEditDialog" 
    />
    <DeleteJobPosition 
        @deleted="refreshTable" 
        :jobPosition="selectedItem" 
        v-model:visible="showDeleteDialog"
    />
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from "@/utils/axios.js";
import GenericTable from "@/components/Microservice/Rating/Tables/common/GenericTable.vue";
import CreateJobPosition from "@/components/Microservice/Rating/Methods/JobPositions/CreateJobPosition.vue";
import UpdateJobPosition from "@/components/Microservice/Rating/Methods/JobPositions/UpdateJobPosition.vue";
import DeleteJobPosition from "@/components/Microservice/Rating/Methods/JobPositions/DeleteJobPosition.vue";
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
    { field: 'title', header: 'Наименование', filterable: true, filterType: 'text', placeholder: 'Поиск по наименованию...' },
    { field: 'department', header: 'Отдел', filterable: false },
    { field: 'createdAt', header: 'Создано', filterable: false },
    { field: 'changedAt', header: 'Изменено', filterable: false },
    { field: 'methodOfCreation', header: 'Способ создания', filterable: false }
];

const defaultColumns = ['title', 'department', 'createdAt'];
const initialFilters = { title: '' };

// API функции
const fetchJobPositions = async (request) => {
    const { data } = await axiosInstance.post('/api/rating/job-positions/paginated', request);
    return { data };
};

// Обработчики
const openCreateDialog = () => {
    showCreateDialog.value = true;
    console.log('fff')
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
</script>

<style scoped>
.department-tag {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    font-size: 0.813rem;
    padding: 0.375rem 0.75rem;
    font-weight: 500;
}
</style>