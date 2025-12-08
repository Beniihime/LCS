<template>
    <GenericTable
        ref="tableRef"
        title="Отделы"
        icon="pi pi-building"
        :columns="columns"
        :fetch-function="fetchDepartments"
        :initial-filters="initialFilters"
        :default-columns="defaultColumns"
        @create="openCreateDialog"
        @edit="openEditDialog"
        @delete="openDeleteDialog"
    >
        <template #body-number="{ data }">
            <Tag :value="data.number" severity="secondary" />
        </template>
        
        <template #body-name="{ data }">
            {{ data.name }}
        </template>
    </GenericTable>

    <CreateDepartment 
        v-model:visible="showCreateDialog" 
        @created="refreshTable"
    />
    <UpdateDepartment 
        @edited="refreshTable" 
        :department="selectedItem" 
        v-model:visible="showEditDialog" 
    />
    <DeleteDepartment 
        @deleted="refreshTable" 
        :department="selectedItem" 
        v-model:visible="showDeleteDialog"
    />
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from "@/utils/axios.js";
import GenericTable from "@/components/Microservice/Rating/Tables/common/GenericTable.vue";
import CreateDepartment from "@/components/Microservice/Rating/Methods/Departments/CreateDepartment.vue";
import UpdateDepartment from "@/components/Microservice/Rating/Methods/Departments/UpdateDepartment.vue";
import DeleteDepartment from "@/components/Microservice/Rating/Methods/Departments/DeleteDepartment.vue";

// Рефы
const tableRef = ref();
const selectedItem = ref(null);

// Диалоги
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);

// Конфигурация таблицы
const columns = [
    { field: 'number', header: '№', filterable: false },
    { field: 'name', header: 'Наименование', filterable: true, filterType: 'text', placeholder: 'Поиск...' },
];

const defaultColumns = ['number', 'name'];
const initialFilters = { name: '' };

// API функции
const fetchDepartments = async (request) => {
    const { data } = await axiosInstance.post('/api/rating/departments/paginated', request);
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
</script>