<template>
    <section class="content-wrapper">
        <div class="section-header">
            <div class="section-title-wrapper">
                <i class="pi pi-users section-icon"></i>
                <h2 class="section-title">Сотрудники</h2>
            </div>
        </div>

        <!-- Таблица сотрудников -->
        <div class="table-container">
            <DataTable 
                :value="employeesData.entities" 
                :loading="loadingEmployees"
                class="p-datatable-sm"
                responsive-layout="scroll"
                filterDisplay="row"
                paginator
                lazy
                :rows="employeePagination.pageSize"
                :totalRecords="employeesData.countEntities"
                :first="employeePagination.page * employeePagination.pageSize"
                @page="onEmployeePageChange"
                :rowsPerPageOptions="[5, 10, 20, 50]"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            >
                <template #header>
                    <div class="d-flex justify-content-between align-items-center">
                        <h4 class="title m-0">Все сотрудники</h4>
                        <MultiSelect 
                            :modelValue="selectedEmployeeColumnsComputed"
                            :options="employeeColumns"
                            optionLabel="header"
                            display="chip"
                            placeholder="Выберите поля"
                            @update:modelValue="onEmployeeColumnsToggle"
                        />
                    </div>
                </template>

                <Column
                    v-for="col in selectedEmployeeColumnsComputed"
                    :key="col.field"
                    :field="col.field"
                    :header="col.header"
                    :sortable="false"
                    :showFilterMenu="false"
                    style="min-width: 180px;"
                >
                    <template #body="{ data }">
                        <template v-if="col.field === 'fullName'">
                            {{ data.lastName }} {{ data.firstName }} {{ data.middleName || '' }}
                        </template>
                        <template v-else-if="col.field === 'email'">
                            {{ data.email || '-' }}
                        </template>
                        <template v-else-if="col.field === 'inn'">
                            {{ data.inn || '-' }}
                        </template>
                        <template v-else-if="col.field === 'snils'">
                            {{ data.snils || '-' }}
                        </template>
                        <template v-else-if="col.field === 'jobPositions'">
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
                        <template v-else-if="col.field === 'createdAt'">
                            {{ formatDate(data.createdAt) }}
                        </template>
                        <template v-else-if="col.field === 'changedAt'">
                            {{ formatDate(data.changedAt) }}
                        </template>
                        <template v-else-if="col.field === 'methodOfCreation'">
                            <Tag :value="data.methodOfCreation" 
                                :severity="getMethodSeverity(data.methodOfCreation)" />
                        </template>
                        <template v-else>
                            {{ data[col.field] }}
                        </template>
                    </template>
                    <template #filter v-if="col.filterable">
                        <InputText 
                            v-if="col.filterType === 'text'"
                            v-model="employeeFilters[col.filterField]"
                            :placeholder="col.placeholder"
                            @input="debounceFetchEmployees"
                        />
                        <Select 
                            v-else-if="col.filterType === 'select'"
                            v-model="employeeFilters[col.filterField]"
                            :options="col.options"
                            optionLabel="label"
                            optionValue="value"
                            :placeholder="col.placeholder"
                            @change="fetchEmployees"
                        />
                    </template>
                </Column>
                <Column header="Действия" style="width: 100px">
                    <template #body="{ data }">
                        <Button 
                            icon="pi pi-pencil" 
                            class="p-button-text p-button-rounded"
                            @click="openEditEmployeeDialog(data)"
                            v-tooltip="'Редактировать'"
                        />
                        <Button 
                            icon="pi pi-trash" 
                            class="p-button-text p-button-rounded p-button-danger"
                            @click="openDeleteEmployeeDialog(data)"
                            v-tooltip="'Удалить'"
                        />
                    </template>
                </Column>

                <template #paginatorstart>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>Всего сотрудников: {{ employeesData.countEntities }}</div>
                    </div>
                </template>

                <template #paginatorend>
                    <div class="d-flex align-items-center">
                        <span>Показать</span>
                        <Select 
                            v-model="employeePagination.pageSize"
                            :options="rowsPerPageOptions"
                            optionLabel="label"
                            optionValue="value"
                            class="search mx-1 px-1"
                            @change="onEmployeeRowsChange"
                        />
                        <span>строк</span>
                    </div>
                </template>
            </DataTable>
        </div>

        <CreateEmployee 
            v-model:visible="showCreateEmployee" 
            @created="fetchEmployees"
            ref="createEmployeeDialogRef"
        />
        <UpdateEmployee 
            @edited="fetchEmployees" 
            :employee="selectedEmployee" 
            v-model:visible="showEditEmployeeDialog" 
        />
        <DeleteEmployee 
            @deleted="fetchEmployees" 
            :employee="selectedEmployee" 
            v-model:visible="showDeleteEmployeeDialog"
        />

    </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axiosInstance from "@/utils/axios.js";

import CreateEmployee from "@/components/Microservice/Rating/Methods/Employees/CreateEmployee.vue";
import UpdateEmployee from "@/components/Microservice/Rating/Methods/Employees/UpdateEmployee.vue";
import DeleteEmployee from "@/components/Microservice/Rating/Methods/Employees/DeleteEmployee.vue";

const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
];

// ========== СОТРУДНИКИ ==========
const employeesData = ref({
    entities: [],
    countPages: null,
    countEntities: null
});
const employeePagination = ref({
    page: 0,
    pageSize: 10
});
const employeeFilters = ref({
    fullName: '',
    jobPositionId: null
});
const selectedEmployee = ref(null);
const showCreateEmployee = ref(false);
const showEditEmployeeDialog = ref(false);
const showDeleteEmployeeDialog = ref(false);
const loadingEmployees = ref(false);

// Колонки сотрудников
const employeeColumns = ref([
    { field: 'fullName', header: 'ФИО', filterable: true, filterField: 'fullName', filterType: 'text', placeholder: 'Поиск по ФИО...' },
    { field: 'email', header: 'Email', filterable: false },
    { field: 'inn', header: 'ИНН', filterable: false },
    { field: 'snils', header: 'СНИЛС', filterable: false },
    { field: 'jobPositions', header: 'Должности', filterable: true, filterField: 'jobPositionId', filterType: 'select', placeholder: 'Все должности' },
    { field: 'createdAt', header: 'Создано', filterable: false },
    { field: 'changedAt', header: 'Изменено', filterable: false },
    { field: 'methodOfCreation', header: 'Способ создания', filterable: false }
]);

const defaultEmployeeColumns = ['fullName', 'email', 'jobPositions'];
const selectedEmployeeColumns = ref(defaultEmployeeColumns);

const selectedEmployeeColumnsComputed = computed(() => 
    employeeColumns.value.filter(c => selectedEmployeeColumns.value.includes(c.field))
);

const onEmployeeColumnsToggle = (val) => {
    selectedEmployeeColumns.value = val.map(col => col.field);
};

// Debounce таймеры
let employeeDebounceTimer;

// Загрузка списка должностей для фильтра сотрудников
const loadJobPositionsForFilter = async () => {
    try {
        const { data } = await axiosInstance.get('/api/rating/job-positions');
        // Находим колонку "Должности" и обновляем options
        const jobPositionColumn = employeeColumns.value.find(col => col.field === 'jobPositions');
        if (jobPositionColumn) {
            jobPositionColumn.options = [
                { label: 'Все', value: null },
                ...data.map(jp => ({ label: jp.title, value: jp.id }))
            ];
        }
    } catch (error) {
        console.error('Ошибка при загрузке должностей для фильтра: ', error);
    }
};

// Получение цвета для метода создания
const getMethodSeverity = (method) => {
    switch (method) {
        case 'Manually': return 'success';
        case 'Automatic': return 'info';
        default: return 'secondary';
    }
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
};

// Сотрудники
const fetchEmployees = async () => {
    loadingEmployees.value = true;
    try {
        const request = {
            page: employeePagination.value.page + 1,
            pageSize: employeePagination.value.pageSize,
            fullName: employeeFilters.value.fullName || undefined,
            jobPositionId: employeeFilters.value.jobPositionId || undefined
        };
        
        const { data } = await axiosInstance.post('/api/rating/employees/paginated', request);
        employeesData.value = data;
        
        showEditEmployeeDialog.value = false;
        showDeleteEmployeeDialog.value = false;
    } catch (error) {
        console.error('Ошибка при получении сотрудников: ', error);
    } finally {
        loadingEmployees.value = false;
    }
};

const debounceFetchEmployees = () => {
    clearTimeout(employeeDebounceTimer);
    employeeDebounceTimer = setTimeout(() => {
        employeePagination.value.page = 0;
        fetchEmployees();
    }, 500);
};

const onEmployeePageChange = (event) => {
    employeePagination.value.page = event.page;
    employeePagination.value.pageSize = event.rows;
    fetchEmployees();
};

const onEmployeeRowsChange = () => {
    employeePagination.value.page = 0;
    fetchEmployees();
};

const clearEmployeeFilter = (key) => {
    employeeFilters.value[key] = null;
    employeePagination.value.page = 0;
    fetchEmployees();
};

const openEditEmployeeDialog = (employee) => {
    selectedEmployee.value = employee;
    showEditEmployeeDialog.value = true;
};

const openDeleteEmployeeDialog = (employee) => {
    selectedEmployee.value = employee;
    showDeleteEmployeeDialog.value = true;
};

onMounted(async () => {
    await Promise.all([
        fetchEmployees(),
        loadJobPositionsForFilter()
    ]);
});
</script>

<style scoped>
/* ========== Секция контента ========== */
.content-wrapper {
    flex-shrink: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 2.5rem 8rem;
    overflow: hidden;
    color: var(--p-text-color);
}

.content-wrapper:not(:last-child) {
    border-bottom: 1px solid var(--p-surface-200);
}

.p-dark .content-wrapper:not(:last-child) {
    border-bottom: 1px solid var(--p-surface-700);
}

/* ========== Заголовки секций ========== */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.section-title-wrapper {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.section-icon {
    font-size: 1.75rem;
    color: var(--p-text-color);
    padding: 0.75rem;
    background: linear-gradient(135deg, var(--p-primary-100), var(--p-primary-50));
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(var(--p-primary-color-rgb, 59, 130, 246), 0.15);
}

.p-dark .section-icon {
    background: linear-gradient(135deg, var(--p-primary-700), var(--p-primary-600));
    box-shadow: 0 2px 8px rgba(var(--p-primary-color-rgb, 59, 130, 246), 0.25);
}

.section-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    background: var(--p-text-color);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* ========== Теги должностей в таблице ========== */
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

/* ========== Адаптивность ========== */
@media (max-width: 1400px) {
    .content-wrapper {
        padding: 2rem 4rem;
    }
}

@media (max-width: 1024px) {
    .content-wrapper {
        padding: 1.5rem 2rem;
    }
    
    .section-title {
        font-size: 1.5rem;
    }
}

@media (max-width: 768px) {
    .content-wrapper {
        padding: 1.25rem 1rem;
    }
    
    .section-title-wrapper {
        gap: 0.75rem;
    }
    
    .section-icon {
        font-size: 1.5rem;
        padding: 0.625rem;
    }
    
    .section-title {
        font-size: 1.25rem;
    }
}

</style>