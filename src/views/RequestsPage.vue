<template>
    <div class="content">
        <div class="content-wrap">

            <!-- Подсказка для прокрутки таблицы -->
            <div v-if="showScrollHint" class="scroll-hint" @click="hideScrollHint">
                Прокрутите таблицу вправо, чтобы увидеть больше данных.
            </div>

            <Transition name="content-fade" mode="out-in">
                <DataTable
                    key="requests-content"
                    v-if="!loading"
                    :value="calls"
                    filterDisplay="row"
                    paginator
                    :rows="rowsPerPage"
                    :first="firstRowIndex"
                    :totalRecords="totalRecords"
                    :sortField="sortField"
                    :sortOrder="sortOrder"
                    scrollable
                    removableSort
                    stripedRows
                    @page="onPage"
                    @sort="onSort"
                    :rowClass="rowClass"
                    @row-click="(event) => openCallDetails(event.data.id)"
                >
                <template #header>
                    <div class="row justify-content-between align-items-center">
                        <div class="col d-flex justify-content-start">
                            <h3 class="title m-0">Ваши заявки</h3>
                        </div>
                        <div class="col d-flex justify-content-end gap-2">
                            <MultiSelect
                                :modelValue="selectedColumns"
                                :options="columns"
                                optionLabel="header"
                                display="chip"
                                placeholder="Выберите поля"
                                @update:modelValue="onToggle"
                            />
                            <Button icon="pi pi-plus" @click="openCreateModal" />
                            <Button 
                                icon="pi pi-sync"
                                outlined
                                severity="secondary"
                                @click="fetchCalls"
                                :loading="loading"
                                :disabled="loading"
                            />
                        </div>
                    </div>
                </template>

                <template #empty>Не найдено.</template>

                <Column field="documentCount" header="" sortable style="min-width: 50px;">
                    <template #body="{ data }">
                        <OverlayBadge :value="data.documentCount" :severity="data.documentCount ? 'danger' : 'secondary'">
                            <i class="pi pi-file" style="font-size: 2rem" />
                        </OverlayBadge>
                    </template>
                </Column>

                <Column 
                    v-for="col in selectedColumns"
                    :key="col.field"
                    :field="col.field"
                    :header="col.header"
                    :sortable="true"
                    :showFilterMenu="false"
                    :frozen="col.field === 'number'"
                    style="min-width: 300px;"
                >
                    <template #body="{ data }">
                        <template v-if="col.field === 'entityStateName'">
                            <Tag :value="data.entityStateName" :severity="getStatusSeverity(data.entityStateName)" :icon="getStatusIcon(data.entityStateName)"/>
                        </template>
                        <template v-else-if="col.field === 'priorityName'">
                            <div class="d-flex align-items-center">
                                <Tag :value="data.priorityName" :severity="data.priorityName === 'Высокий' ? 'danger' : data.priorityName === 'Низкий' ? 'success' : 'info'" />
                            </div>
                        </template>

                        <template v-else>
                            {{ data[col.field] }}
                        </template>
                    </template>
                    <template #filter v-if="col.filterable">
                        <InputText 
                            v-if="col.filterType === 'text'"
                            v-model="filters[col.field]"
                            :placeholder="col.placeholder"
                            @input="handleFilterInput(col.field, filters[col.field])"
                            class="w-75"
                        />
                        <MultiSelect 
                            v-else-if="col.filterType === 'multiselect'"
                            v-model="filters[col.filterField]"
                            :options="col.options"
                            optionLabel="label"
                            optionValue="value"
                            class="w-75"
                            :placeholder="col.placeholder"
                            @change="handleFilterInput(col.filterField, filters[col.filterField])"
                        />
                        <Select
                            v-else-if="col.filterType === 'select' && col.filterField === 'serviceName'"
                            v-model="filters[col.filterField]"
                            :options="col.options"
                            optionLabel="label"
                            optionValue="value"
                            class="w-75"
                            :placeholder="col.placeholder"
                            @change="handleFilterInput(col.filterField, filters[col.filterField])"
                        />
                        <Select
                            v-else-if="col.filterType === 'select'"
                            v-model="filters[col.filterField]"
                            :options="col.options"
                            optionLabel="name"
                            optionValue="id"
                            class="w-75"
                            :placeholder="col.placeholder"
                            @change="handleFilterInput(col.filterField, filters[col.filterField])"
                        />
                        <Button 
                            icon="pi pi-filter-slash"
                            text
                            severity="contrast"
                            class="ms-2"
                            v-if="filters[col.filterField] && (Array.isArray(filters[col.filterField]) ? filters[col.filterField].length : true)"
                            @click="clearFilter(col.filterField)"
                        />
                    </template>
                </Column>

                <template #paginatorstart>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>Всего заявок: {{ totalRecords }}</div>
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
                </DataTable>

                <Skeleton key="requests-skeleton" v-else width="100%" height="100%" class="skeleton-table" />
            </Transition>
        </div>
        <CreateRequest ref="createRequestRef" :showButton="false" @refreshRequests="(id) => fetchCalls(id)"/>
        <InfraManagerCallsMe ref="callDetailsRef" class="position-absolute opacity-0" style="z-index: -999;"/>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import qs from 'qs';
import axiosInstance from '@/utils/axios.js';
import { getInfraStatusIcon, getInfraStatusSeverity } from '@/utils/infraStatus.js';
import { formatDateOmskFromUtcString } from '@/utils/date.js';
import {
    buildTableStateKey,
    readTableState,
    getNumberOrDefault,
    getStringOrEmpty,
    getArrayOrDefault,
    getQueryArray
} from '@/utils/tableState.js';
import { useTableStatePersistence } from '@/composables/useTableStatePersistence.js';

import InfraManagerCallsMe from '@/components/InfraManager/InfraManagerCallsMe.vue';
import CreateRequest from '@/components/InfraManager/CreateRequest.vue';

const REQUESTS_TABLE_STATE_KEY = buildTableStateKey('requests');
const REQUESTS_TABLE_STATE_LEGACY_KEY = 'lcs.requests.table-state';
const defaultEntityStates = ['Инициирована', 'Открыта', 'Зарегистрирована', 'Ожидает'];
const defaultColumns = ['number', 'entityStateName', 'priorityName', 'callSummaryName', 'clientFullName', 'executorFullName'];
const savedState = readTableState(REQUESTS_TABLE_STATE_KEY, {
    legacyKeys: [REQUESTS_TABLE_STATE_LEGACY_KEY]
});

const loading = ref(true);

const calls = ref([]);  // Все загруженные заявки
const currentPage = ref(getNumberOrDefault(savedState?.currentPage, 1));  // Текущая страница
const rowsPerPage = ref(getNumberOrDefault(savedState?.rowsPerPage, 10));  // Количество строк на странице
const totalRecords = ref(0);  // Общее количество заявок
const totalPages = ref(0);
const loadedPages = ref(10);
const sortField = ref(typeof savedState?.sortField === 'string' ? savedState.sortField : null);
const sortOrder = ref(savedState?.sortOrder === 1 || savedState?.sortOrder === -1 ? savedState.sortOrder : null);

const route = useRoute();
const router = useRouter();

const serviceOptions = ref([]);
const priorityOptions = ref([]);
const stateOptions = ref([]);

const rowsPerPageOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
];

const columns = ref([
    { field: 'number', header: '№', placeholder: 'Введите номер...', filterable: true, filterField: 'number', filterType: 'text' },
    { field: 'entityStateName', header: 'Статус', placeholder: 'Выберите статус', filterable: true, filterField: 'entityStateNames', filterType: 'multiselect', options: stateOptions },
    { field: 'priorityName', header: 'Приоритет', placeholder: 'Выберите приоритет', filterable: true, filterField: 'priorityId', filterType: 'select', options: priorityOptions },
    { field: 'clientFullName', header: 'Клиент' },
    { field: 'callSummaryName', header: 'Сводка', placeholder: 'Введите...', filterable: true, filterField: 'callSummaryName', filterType: 'text' },
    { field: 'description', header: 'Описание' },
    { field: 'solution', header: 'Решение' },
    { field: 'serviceItemFullName', header: 'Элемент сервиса' },
    { field: 'serviceAttendanceFullName', header: 'Выполнил' },
    { field: 'serviceName', header: 'Сервис', placeholder: 'Выберите сервис', filterable: true, filterField: 'serviceName', filterType: 'select', options: serviceOptions },
    { field: 'callTypeFullName', header: 'Тип заявки' },
    { field: 'ownerFullName', header: 'Владелец' },
    { field: 'executorFullName', header: 'Исполнитель' },
    { field: 'utcDateRegistered', header: 'Дата регистрации' },
    { field: 'utcDateModified', header: 'Дата изменения' },
    { field: 'utcDateClosed', header: 'Дата закрытия' }
]);

const selectedColumnFields = ref(
    Array.isArray(savedState?.selectedColumnFields) && savedState.selectedColumnFields.length
        ? savedState.selectedColumnFields
        : defaultColumns
);

const selectedColumns = computed(() => 
    columns.value.filter(c => selectedColumnFields.value.includes(c.field))
);

const onToggle = (val) => {
    selectedColumnFields.value = val.map(col => col.field);
};

const firstRowIndex = computed(() => (currentPage.value - 1) * rowsPerPage.value);

const getStatusSeverity = getInfraStatusSeverity;
const getStatusIcon = getInfraStatusIcon;
const formatUTCToOmsk = formatDateOmskFromUtcString;

const rowClass = (data) => {
    return [{ 'removed-row': data.removed , 'not-allowed': data.removed, 'pointer': !data.removed, 'highlighted-row': data.id === lastCreatedId.value }];
};

const formatUtcFields = (obj) => {
    if (Array.isArray(obj)) {
        return obj.map(formatUtcFields);
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            if (key.startsWith('utc') && obj[key]) {
                newObj[key] = formatUTCToOmsk(obj[key]);
            } else {
                newObj[key] = formatUtcFields(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
};

const lastCreatedId = ref(null);

// Загрузка заявок (по страницам)
const fetchCalls = async (highlightId = null) => {
    try {
        loading.value = true;

        const response = await axiosInstance.get('/api/infra-manager/users/me/calls', {
            params: {
                page: 1,
                pageSize: rowsPerPage.value * 5,
                ...filters,
            },
                
            paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' })
        });

        if (response.data?.entities) {
            calls.value = formatUtcFields(response.data.entities);
            totalRecords.value = response.data.countAllEntities;
            totalPages.value = response.data.countAllPages;
            loadedPages.value = 5;
        }

        if (highlightId) {
            lastCreatedId.value = highlightId;
            console.debug(lastCreatedId.value);
            setTimeout(() => {
                lastCreatedId.value = null;
            }, 5000);
        }

        loading.value = false;
    } catch (error) {
        console.error('Ошибка при загрузке: ', error);
        loading.value = false;
    }
};

const loadMorePages = async () => {
    try {
        const response = await axiosInstance.get('/api/infra-manager/users/me/calls', {
            params: {
                page: loadedPages.value / 5 + 1,
                pageSize: rowsPerPage.value * 5,
                ...filters
            },
        });

        if (response.data?.entities) {
            calls.value.push(...formatUtcFields(response.data.entities));
            loadedPages.value += 5;
        }
    } catch (erorr) {
        console.debug('Ошибка при загрузке: ', error);
    }
}

const ensureCurrentPageLoaded = async () => {
    while ((currentPage.value >= loadedPages.value - 1 || currentPage.value === loadedPages.value)
        && calls.value.length !== totalRecords.value) {
        await loadMorePages();
    }
};

// При изменении страницы
const onPage = async (event) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;

    if ((currentPage.value >= loadedPages.value - 1 && 
            calls.value.length != totalRecords.value) || 
            (currentPage.value === loadedPages.value && calls.value.length != totalRecords.value)) {
        await loadMorePages();
    }
};

const onSort = (event) => {
    sortField.value = event.sortField || null;
    sortOrder.value = typeof event.sortOrder === 'number' ? event.sortOrder : null;
};

const fetchFilterOptions = async () => {
    try {
        const [services, priorities, states] = await Promise.all([
            axiosInstance.get('/api/infra-manager/calls/service-names'),
            axiosInstance.get('/api/infra-manager/calls/priorities'),
            axiosInstance.get('/api/infra-manager/calls/states'),
        ]);

        serviceOptions.value = services.data.map(service => ({ label: service, value: service }));
        console.log(serviceOptions.value);
        priorityOptions.value = [
            { id: '', name: 'Все' },
            ...priorities.data
        ]
        stateOptions.value = states.data.map(state => ({ label: state, value: state }));
    } catch (error) {
        console.debug('Ошибка загрузки данных для фильтров: ', error);
    }
};

const filters = reactive({
    number: getStringOrEmpty(route.query.number ?? savedState?.filters?.number),
    callSummaryName: getStringOrEmpty(route.query.callSummaryName ?? savedState?.filters?.callSummaryName),
    serviceName: getQueryArray(route.query.serviceName, getArrayOrDefault(savedState?.filters?.serviceName, [])),
    priorityId: getStringOrEmpty(route.query.priorityId ?? savedState?.filters?.priorityId),
    entityStateNames: getQueryArray(route.query.entityStateNames, getArrayOrDefault(savedState?.filters?.entityStateNames, defaultEntityStates))
});

const debouncedUpdateQuery = debounce((key, value) => {
    const query = { ...route.query };

    if (value && value.length !== 0) {
        if (Array.isArray(value)) {
            query[key] = value;
        } else {
            query[key] = value;
        }
    } else {
        delete query[key];
    }

    router.push({ query });
}, 750);

const clearFilter = (key) => {
    filters[key] = Array.isArray(filters[key]) ? [] : '';
    currentPage.value = 1;
    debouncedUpdateQuery(key, filters[key]);
}

// Обновление query при входе
const handleFilterInput = (key, value) => {
    filters[key] = value;
    currentPage.value = 1;
    debouncedUpdateQuery(key, value);
}

watch (
    () => route.query,
    async () => {
        await fetchCalls();
    },
    { immediate: true }
);

useTableStatePersistence({
    key: REQUESTS_TABLE_STATE_KEY,
    collectState: () => ({
        rowsPerPage: rowsPerPage.value,
        currentPage: currentPage.value,
        sortField: sortField.value,
        sortOrder: sortOrder.value,
        selectedColumnFields: selectedColumnFields.value,
        filters: { ...filters }
    }),
    watchTargets: [
        [rowsPerPage, currentPage, sortField, sortOrder, selectedColumnFields],
        filters
    ]
});

const callDetailsRef = ref(null); // Ссылка на дочерний компонент InfraManagerCalls
const createRequestRef = ref(null);
const shouldOpenCreateModal = ref(false);

const openCallDetails = (id) => { nextTick(() => { callDetailsRef.value?.openCallDetails(id); }); };
const openCreateModal = () => { createRequestRef.value?.openModal?.(); };

const showScrollHint = ref(true);

const hideScrollHint = () => {
    showScrollHint.value = false;
};

watch(
    () => route.query.create,
    (createFlag) => {
        shouldOpenCreateModal.value = createFlag === '1';
    },
    { immediate: true }
);

watch(
    [shouldOpenCreateModal, createRequestRef],
    async ([needOpen]) => {
        if (!needOpen || !createRequestRef.value?.openModal) return;

        await nextTick();
        createRequestRef.value.openModal();
        shouldOpenCreateModal.value = false;

        const query = { ...route.query };
        delete query.create;
        router.replace({ query });
    },
    { immediate: true }
);

onMounted(async () => {
    await fetchFilterOptions();
    await ensureCurrentPageLoaded();
    setTimeout(() => {
        hideScrollHint();
    }, 8000);
});
</script>

<style scoped>
.content {
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100dvh;
}
.content-wrap {
    flex-grow: 1;
    align-content: center;
    padding: 10px 10px;
    color: var(--p-text-color);
    transition: all 0.5s;
    height: 100%;
}
.pi {
    font-size: 2rem;
}
.search {
    border-radius: 12px;
    font-size: 18px;
    transition: all 0.5s;
}
.skeleton-table {
    border-radius: 12px;
    background-color: var(--p-grey-3);
}
.scroll-hint {
    position: absolute;
    top: 20px;
    right: 50%;
    transform: translateX(50%);
    background: var(--p-blue-500);
    color: white;
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 14px;
    text-align: center;
    z-index: 1000;
    cursor: pointer;
    animation: fadeInOut 5s forwards;
}

@keyframes fadeInOut {
    0%, 80% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}
</style>
