<template>
    <main>
        <div class="content">
            <div class="content-wrap">
                <div v-if="showScrollHint" class="scroll-hint" @click="hideScrollHint">
                    Прокрутите таблицу вправо, чтобы увидеть больше данных.
                </div>
                <Transition name="content-fade" mode="out-in">
                <section v-if="isCardMode && (!loading || calls.length)" key="infra-manager-cards" class="requests-mobile-layout">
                    <div class="requests-mobile-toolbar">
                        <div>
                            <h3 class="title m-0">Все заявки</h3>
                            <p class="requests-mobile-subtitle">Быстрый просмотр актуальных обращений и статусов.</p>
                        </div>
                        <div class="requests-mobile-toolbar-actions">
                            <Button icon="pi pi-arrow-left" outlined severity="secondary" @click="goBack" />
                            <Button icon="pi pi-filter" outlined severity="secondary" @click="showMobileFilters = !showMobileFilters" />
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

                    <div v-if="showMobileFilters" class="requests-mobile-filters">
                        <InputText
                            v-model="filters.number"
                            placeholder="Поиск по номеру"
                            @input="handleFilterInput('number', filters.number)"
                        />
                        <InputText
                            v-model="filters.callSummaryName"
                            placeholder="Поиск по сводке"
                            @input="handleFilterInput('callSummaryName', filters.callSummaryName)"
                        />
                        <Select
                            v-model="filters.priorityId"
                            :options="priorityOptions"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Приоритет"
                            @change="handleFilterInput('priorityId', filters.priorityId)"
                        />
                        <MultiSelect
                            v-model="filters.entityStateNames"
                            :options="stateOptions"
                            optionLabel="label"
                            optionValue="value"
                            display="chip"
                            placeholder="Статусы"
                            @change="handleFilterInput('entityStateNames', filters.entityStateNames)"
                        />
                        <Select
                            v-model="filters.serviceName"
                            :options="serviceOptions"
                            optionLabel="label"
                            optionValue="label"
                            placeholder="Сервис"
                            @change="handleFilterInput('serviceName', filters.serviceName)"
                        />
                        <div class="requests-mobile-filter-actions">
                            <Select
                                v-model="rowsPerPage"
                                :options="rowsPerPageOptions"
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Строк на странице"
                                @change="resetPagination"
                            />
                            <Button
                                label="Сбросить"
                                text
                                severity="secondary"
                                @click="clearMobileFilters"
                            />
                        </div>
                    </div>

                    <div class="requests-mobile-summary">
                        <span>Всего заявок: {{ totalRecords }}</span>
                        <span>Показано: {{ currentPageCalls.length }}</span>
                    </div>

                    <div v-if="currentPageCalls.length" class="requests-card-list">
                        <article
                            v-for="call in currentPageCalls"
                            :key="call.id"
                            class="requests-card"
                            :class="{ 'removed-row': call.removed }"
                            @click="openCallDetails(call.id)"
                        >
                            <div class="requests-card-head">
                                <div class="requests-card-number">
                                    <OverlayBadge :value="call.documentCount" :severity="call.documentCount ? 'danger' : 'secondary'">
                                        <i class="pi pi-file"></i>
                                    </OverlayBadge>
                                    <strong>№ {{ call.number || '—' }}</strong>
                                </div>
                                <Tag
                                    :value="call.entityStateName"
                                    :severity="getStatusSeverity(call.entityStateName)"
                                    :icon="getStatusIcon(call.entityStateName)"
                                />
                            </div>

                            <div class="requests-card-row">
                                <span class="requests-card-label">Сводка</span>
                                <span class="requests-card-value">{{ call.callSummaryName || '—' }}</span>
                            </div>

                            <div class="requests-card-meta">
                                <Tag
                                    :value="call.priorityName || 'Без приоритета'"
                                    :severity="call.priorityName === 'Высокий' ? 'danger' : call.priorityName === 'Низкий' ? 'success' : 'info'"
                                />
                                <span class="requests-card-meta-item">{{ call.clientFullName || 'Клиент не указан' }}</span>
                                <span class="requests-card-meta-item">{{ call.executorFullName || 'Исполнитель не назначен' }}</span>
                            </div>

                            <div class="requests-card-row">
                                <span class="requests-card-label">Описание</span>
                                <span class="requests-card-value clamp-2">{{ call.description || '—' }}</span>
                            </div>

                            <div class="requests-card-footer">
                                <span>{{ call.utcDateRegistered ? formatUTCToOmsk(call.utcDateRegistered) : 'Дата регистрации не указана' }}</span>
                                <Button
                                    label="Открыть"
                                    size="small"
                                    outlined
                                    severity="secondary"
                                    @click.stop="openCallDetails(call.id)"
                                />
                            </div>
                        </article>
                    </div>
                    <div v-else class="requests-empty-state">Не найдено.</div>

                    <div class="requests-mobile-paginator">
                        <Paginator
                            :rows="rowsPerPage"
                            :first="firstRowIndex"
                            :totalRecords="totalRecords"
                            @page="onPage"
                        />
                    </div>
                </section>
                <DataTable
                    key="infra-manager-table-content"
                    v-else-if="!loading || calls.length"
                    :value="calls"
                    :filters="filters"
                    filterDisplay="row"
                    paginator
                    :rows="rowsPerPage"
                    :totalRecords="totalRecords"
                    scrollable
                    removableSort
                    stripedRows                    
                    @page="onPage"
                    :rowClass="rowClass"
                    @row-click="(event) => openCallDetails(event.data.id)"
                >
                    <template #header>
                        <div class="d-flex justify-content-between align-items-center">
                            <Button label="Назад" icon="pi pi-arrow-left" @click="goBack"/>
                            <h3 class="title m-0">
                                Все заявки
                            </h3>
                            <AutoComplete 
                                v-model="selectedUser"
                                :suggestions="userSuggestions"
                                optionLabel="fullName"
                                @complete="searchUsers"
                                @item-select="fetchCalls"
                                @clear="fetchCalls"
                                placeholder="Поиск по пользователю"
                            />
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
                    <Column field="number" header="#" sortable :showFilterMenu="false" style="min-width: 180px">
                        <template #body="{ data }">
                            {{ data.number }}
                        </template>
                        <template #filter="{ filterModel, filterCallback }">
                            <div class="d-flex align-items-center">
                                <InputText 
                                    v-model="filters.number"
                                    placeholder="Введите номер..."
                                    @input="handleFilterInput('number', filters.number)"
                                    class="w-100"
                                />
                                <Button 
                                    icon="pi pi-filter-slash"
                                    text
                                    severity="contrast"
                                    class="ms-2"
                                    v-if="filters.number"
                                    @click="clearFilter('number', filterCallback)"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column field="entityStateName" header="Статус" :showFilterMenu="false" style="max-width: 250px;">
                        <template #body="{ data }">
                            <Tag :value="data.entityStateName" :severity="getStatusSeverity(data.entityStateName)" :icon="getStatusIcon(data.entityStateName)" />
                        </template>
                        <template #filter="{ filterCallback }">
                            <div class="d-flex align-items-center">
                                <MultiSelect 
                                    v-model="filters.entityStateNames"
                                    :options="stateOptions"
                                    optionLabel="label"
                                    optionValue="value"
                                    class="w-75"
                                    placeholder="Выберите статус"
                                    @change="handleFilterInput('entityStateNames', filters.entityStateNames)"
                                />
                                <Button 
                                    icon="pi pi-filter-slash"
                                    text
                                    severity="contrast"
                                    class="ms-2"
                                    v-if="filters.entityStateNames"
                                    @click="clearFilter('entityStateNames', filterCallback)"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column field="priorityName" header="Приоритет" :showFilterMenu="false" style="min-width: 200px">
                        <template #body="{ data }">
                            <div class="d-flex align-items-center">
                                <Badge value="" :severity="data.priorityName === 'Высокий' ? 'danger' : data.priorityName === 'Низкий' ? 'success' : 'contrast'" class="me-2 p-2"/>
                                {{ data.priorityName }}
                            </div>
                        </template>
                        <template #filter="{ filterCallback }">
                            <div class="d-flex align-items-center">
                                <Select 
                                    v-model="filters.priorityId"
                                    :options="priorityOptions"
                                    optionLabel="name"
                                    optionValue="id"
                                    class="w-100"
                                    placeholder="Выберите приоритет..."
                                    @change="handleFilterInput('priorityId', filters.priorityId)"
                                />
                                <Button 
                                    icon="pi pi-filter-slash"
                                    text
                                    severity="contrast"
                                    class="ms-2"
                                    v-if="filters.priorityId"
                                    @click="clearFilter('priorityId', filterCallback)"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column field="initiatorFullName" header="Инициатор" sortable style="min-width: 200px">
                        <template #body="{ data }">
                            {{ data.initiatorFullName }}
                        </template>
                    </Column>
                    <Column field="clientFullName" header="Клиент" sortable style="min-width: 200px">
                        <template #body="{ data }">
                            {{ data.clientFullName }}
                        </template>
                    </Column>
                    <Column field="callSummaryName" header="Сводка" :showFilterMenu="false" style="min-width: 200px">
                        <template #body="{ data }">
                            {{ data.callSummaryName }}
                        </template>
                        <template #filter="{ filterCallback }">
                            <div class="d-flex align-items-center">
                                <InputText 
                                    v-model="filters.callSummaryName"
                                    placeholder="Введите..."
                                    @input="handleFilterInput('callSummaryName', filters.callSummaryName)"
                                    class="w-100"
                                />
                                <Button 
                                    icon="pi pi-filter-slash"
                                    text
                                    severity="contrast"
                                    class="ms-2"
                                    v-if="filters.callSummaryName"
                                    @click="clearFilter('callSummaryName', filterCallback)"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column field="description" header="Описание" style="max-width: 150px">
                        <template #body="{ data }">
                            <div style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" v-tooltip="{ value: data.description, showDelay: 800, hideDelay: 300 }">{{ data.description }}</div>
                        </template>
                    </Column>
                    <Column field="solution" header="Решение" style="max-width: 250px;">
                        <template #body="{ data }">
                            <div style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" v-tooltip="{ value: data.solution, showDelay: 800, hideDelay: 300 }">{{ data.solution }}</div>
                        </template>
                    </Column>
                    <Column field="serviceItemFullName" header="Элемент сервиса" style="min-width: 350px">
                        <template #body="{ data }">
                            {{ data.serviceItemFullName }}
                        </template>
                    </Column>

                    <Column field="serviceAttendanceFullName" header="Выполнил" sortable style="min-width: 150px">
                        <template #body="{ data }">
                            {{ data.accomplisherFullName }}
                        </template>
                    </Column>
                    <Column field="serviceName" header="Сервис" :showFilterMenu="false" style="min-width: 250px">
                        <template #body="{ data }">
                            {{ data.serviceName }}
                        </template>
                        <template #filter="{ filterCallback }">
                            <div class="d-flex align-items-center">
                                <Select 
                                    v-model="filters.serviceName"
                                    :options="serviceOptions"
                                    :maxSelectedLabels="1"
                                    optionLabel="label"
                                    optionValue="label"
                                    class="w-75"
                                    placeholder="Выберите сервис..."
                                    @change="handleFilterInput('serviceName', filters.serviceName)"
                                />
                                <Button 
                                    icon="pi pi-filter-slash"
                                    text
                                    severity="contrast"
                                    class="ms-2"
                                    v-if="filters.serviceName"
                                    @click="clearFilter('serviceName', filterCallback)"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column field="callTypeFullName" header="Тип заявки" style="min-width: 100px">
                        <template #body="{ data }">
                            {{ data.callTypeFullName }}
                        </template>
                    </Column>
                    <Column field="ownerFullName" header="Владелец" sortable style="min-width: 200px">
                        <template #body="{ data }">
                            {{ data.ownerFullName }}
                        </template>
                    </Column>
                    <Column field="executorFullName" header="Исполнитель" sortable style="min-width: 200px">
                        <template #body="{ data }">
                            {{ data.executorFullName }}
                        </template>
                    </Column>
                    <Column field="utcDateRegistered" header="Дата регистрации" sortable style="min-width: 290px">
                        <template #body="{ data }">
                            {{ formatUTCToOmsk(data.utcDateRegistered) }}
                        </template>
                    </Column>
                    <Column field="utcDateModified" header="Дата изменения" style="min-width: 290px">
                        <template #body="{ data }">
                            {{ formatUTCToOmsk(data.utcDateModified) }}
                        </template>
                    </Column>
                    <Column field="utcDateClosed" header="Дата закрытия" style="min-width: 290px">
                        <template #body="{ data }">
                            {{ formatUTCToOmsk(data.utcDateClosed) }}
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
                                @change="resetPagination()"
                                optionLabel="label"
                                optionValue="value"
                                class="search mx-1 px-1"
                            />
                            <span>строк</span>
                        </div>
                    </template>
                </DataTable>
                <div key="infra-manager-table-skeleton" v-else class="infra-table-skeleton">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <Skeleton width="7rem" height="2.1rem" />
                        <Skeleton width="10rem" height="1.6rem" />
                        <Skeleton width="14rem" height="2.1rem" />
                    </div>
                    <Skeleton width="100%" height="3rem" class="mb-2" />
                    <Skeleton width="100%" height="3rem" class="mb-2" />
                    <Skeleton width="100%" height="3rem" class="mb-2" />
                    <Skeleton width="100%" height="3rem" class="mb-2" />
                    <Skeleton width="100%" height="3rem" />
                </div>
                </Transition>
            </div>
        </div>
        <InfraManagerCalls ref="callDetailsRef" class="position-absolute opacity-0" @close="clearCallDetailsQuery"/>
    </main>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, reactive, computed } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import qs from 'qs';
import { getInfraStatusIcon, getInfraStatusSeverity } from '@/utils/infraStatus.js';
import { formatDateOmskFromUtcString } from '@/utils/date.js';
import { useResponsiveLayout } from '@/composables/useResponsiveLayout.js';
import { useMobileTableView } from '@/composables/useMobileTableView.js';

import InfraManagerCalls from '@/components/InfraManager/InfraManagerCalls.vue';

const loading = ref(true);

const showScrollHint = ref(true);

const hideScrollHint = () => {
    showScrollHint.value = false;
};

const selectedUser = ref(null);
const userSuggestions = ref([]);
const calls = ref([]);  // Все загруженные заявки
const currentPage = ref(1);  // Текущая страница
const rowsPerPage = ref(10);  // Количество строк на странице
const totalRecords = ref(0);  // Общее количество заявок
const totalPages = ref(0);
const loadedPages = ref(10);

const route = useRoute();
const router = useRouter();
const { isPhone } = useResponsiveLayout();
const {
    isCardMode,
    firstRowIndex,
    currentPageItems: currentPageCalls,
    showMobileFilters,
} = useMobileTableView({
    items: calls,
    currentPage,
    rowsPerPage,
    isPhone,
});

const serviceOptions = ref([]);
const priorityOptions = ref([]);
const stateOptions = ref([]);

const rowsPerPageOptions = [
    { label: '10', value: 10 },
    { label: '15', value: 15 },
    { label: '20', value: 20 },
    { label: '50', value: 50 },
];

const getStatusSeverity = getInfraStatusSeverity;
const getStatusIcon = getInfraStatusIcon;
const formatUTCToOmsk = formatDateOmskFromUtcString;

const rowClass = (data) => {
    return [{ 'removed-row': data.removed , 'not-allowed': data.removed, 'pointer': !data.removed }];
};

const searchUsers = async (event) => {
    try {
        const response = await axiosInstance.get('/api/infra-manager/users', {
            params: { patternSearch: event.query }
        });

        userSuggestions.value = response.data; // Список пользователей для AutoComplete
    } catch (error) {
        console.debug('Ошибка при поиске пользователей: ', error);
    }
}

// Загрузка заявок (по страницам)
const fetchCalls = async () => {
    try {
        loading.value = true;
        const response = await axiosInstance.get('/api/infra-manager/calls', {
            params: {
                page: 1,
                pageSize: rowsPerPage.value * 10,
                ...filters
            },

            paramsSerializer: (params) => {
                return qs.stringify(params, { arrayFormat: 'repeat' })
            }
        });

        if (response.data?.entities) {
            calls.value = response.data.entities;
            totalRecords.value = response.data.countAllEntities;
            totalPages.value = response.data.countAllPages;
            loadedPages.value = 10;
        }
        loading.value = false;
    } catch (error) {
        console.debug('Ошибка при загрузке: ', error);
        loading.value = false;
    }
};

const loadMorePages = async () => {
    try {
        const response = await axiosInstance.get('/api/infra-manager/calls', {
            params: {
                page: loadedPages.value / 10 + 1,
                pageSize: rowsPerPage.value * 10,
                ...filters
            },
            paramsSerializer: (params) => {
                return qs.stringify(params, { arrayFormat: 'repeat' })
            }
        });

        if (response.data?.entities) {
            calls.value.push(...response.data.entities);
            loadedPages.value += 10;
        }
    } catch (erorr) {
        console.debug('Ошибка при загрузке: ', error);
    }
};

const resetPagination = async () => {
    currentPage.value = 1;
    console.log(1)
    loadedPages.value = 10;
    calls.value = [];
    await fetchCalls();
}

// При изменении страницы
const onPage = async (event) => {

    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;

    if ((currentPage.value >= loadedPages.value - 1 && calls.value.length != totalRecords.value) || (currentPage.value === loadedPages.value && calls.value.length != totalRecords.value)) {
        await loadMorePages();
    }
};

const fetchFilterOptions = async () => {
    try {
        const [services, priorities, states] = await Promise.all([
            axiosInstance.get('/api/infra-manager/calls/service-names'),
            axiosInstance.get('/api/infra-manager/calls/priorities'),
            axiosInstance.get('/api/infra-manager/calls/states'),
        ]);

        serviceOptions.value = services.data.map(service => ({ label: service, value: service }));
        priorityOptions.value = priorities.data;
        stateOptions.value = states.data.map(state => ({ label: state, value: state }));
    } catch (error) {
        console.debug('Ошибка загрузки данных для фильтров: ', error);
    }
};

const filters = reactive({
    number: route.query.number || '',
    callSummaryName: route.query.callSummaryName || '',
    serviceName: route.query.serviceName ? route.query.serviceName.split(',') : [],
    priorityId: route.query.priorityId || '',
    entityStateNames: route.query.entityStateNames || ['Инициирована', 'Открыта', 'Зарегистрирована', 'Ожидает']
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

const clearFilter = (key, filterCallback) => {
    filters[key] = '';
    filterCallback();
    debouncedUpdateQuery(key, '');
}

const clearMobileFilters = () => {
    currentPage.value = 1;
    filters.number = '';
    filters.callSummaryName = '';
    filters.serviceName = [];
    filters.priorityId = '';
    filters.entityStateNames = [];

    const query = { ...route.query };
    delete query.number;
    delete query.callSummaryName;
    delete query.serviceName;
    delete query.priorityId;
    delete query.entityStateNames;

    router.push({ query });
};

// Обновление query при входе
const handleFilterInput = (key, value) => {
    filters[key] = value;
    debouncedUpdateQuery(key, value);
}

watch (
    () => route.query,
    async () => {
        await fetchCalls();
    },
    { immediate: true }
);

const goBack = () => {
    router.back();
};

const callDetailsRef = ref(null); // Ссылка на дочерний компонент InfraManagerCalls

const openCallDetailsById = (id) => {
    if (!id) return;

    nextTick(() => {
        callDetailsRef.value?.openCallDetails(id);
    });
};

const openCallDetails = (id) => {
    if (!id) return;

    if (String(route.query.callId || '') === String(id)) {
        openCallDetailsById(id);
        return;
    }

    router.push({
        query: {
            ...route.query,
            callId: id,
        },
    });
};

const clearCallDetailsQuery = () => {
    if (!route.query.callId) return;

    const query = { ...route.query };
    delete query.callId;
    router.replace({ query });
};

watch(
    () => route.query.callId,
    (callId) => {
        if (callId) {
            openCallDetailsById(callId);
        }
    },
    { immediate: true }
);

onMounted(async () => {
    const defaultQuery = {
        entityStateNames: ['Инициирована', 'Открыта', 'Зарегистрирована', 'Ожидает'],
    };

    const updatedQuery = { ...route.query };

    let needsUpdate = false;

    for (const key in defaultQuery) {
        if (!updatedQuery[key]) {
            updatedQuery[key] = defaultQuery[key];
            needsUpdate = true;
        }
    }

    if (needsUpdate) {
        router.replace({ query: updatedQuery });
    }

    await fetchFilterOptions();
    setTimeout(() => {
        hideScrollHint();
    }, 8000);
});

defineExpose({
    loading
});
</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.scroll-hint {
    position: absolute;
    top: 15px;
    right: 50%;
    transform: translateX(50%);
    background: var(--p-blue-500);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
    z-index: 1000;
    cursor: pointer;
    animation: fadeInOut 8s forwards;
}
@keyframes fadeInOut {
    0%, 80% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}
.content {
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
.infra-table-skeleton {
    width: 100%;
}
.openCall:hover {
    text-decoration: underline;
    cursor: pointer;
}
.pi {
    font-size: 2rem;
}
:deep(.p-datatable-tbody > tr:hover) {
    background-color: var(--p-blue-500-low-op) !important;
}

.requests-mobile-layout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.requests-mobile-toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.requests-mobile-subtitle {
    margin: 0.35rem 0 0;
    color: var(--p-text-muted-color, var(--p-grey-2));
    font-size: 0.92rem;
}

.requests-mobile-toolbar-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
}

.requests-mobile-filters {
    display: grid;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 18px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.12);
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.04),
        rgba(255, 255, 255, 0)
    );
    min-width: 0;
}
.requests-mobile-filters > * {
    min-width: 0;
}
.requests-mobile-filters :deep(.p-multiselect),
.requests-mobile-filters :deep(.p-select),
.requests-mobile-filters :deep(.p-inputtext) {
    width: 100%;
}
.requests-mobile-filters :deep(.p-multiselect-label) {
    white-space: normal;
    flex-wrap: wrap;
}

.requests-mobile-filter-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    align-items: center;
}

.requests-mobile-summary {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    font-size: 0.92rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.requests-card-list {
    display: grid;
    gap: 0.85rem;
}

.requests-card {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 1rem;
    border-radius: 18px;
    border: 1px solid rgba(var(--p-blue-500-rgb), 0.14);
    background: linear-gradient(
        180deg,
        rgba(var(--p-blue-500-rgb), 0.05),
        rgba(255, 255, 255, 0)
    );
    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.requests-card-head,
.requests-card-number,
.requests-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.requests-card-number {
    justify-content: flex-start;
}

.requests-card-number .pi {
    font-size: 1.3rem;
}

.requests-card-row {
    display: flex;
    flex-direction: column;
    gap: 0.28rem;
}

.requests-card-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.requests-card-value {
    color: var(--p-text-color);
    line-height: 1.45;
}

.requests-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
}

.requests-card-meta-item {
    display: inline-flex;
    align-items: center;
    padding: 0.38rem 0.7rem;
    border-radius: 999px;
    background: rgba(var(--p-blue-500-rgb), 0.08);
    font-size: 0.82rem;
}

.requests-card-footer {
    align-items: flex-end;
    font-size: 0.85rem;
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.requests-empty-state {
    padding: 2rem 1rem;
    text-align: center;
    border-radius: 18px;
    border: 1px dashed rgba(var(--p-blue-500-rgb), 0.18);
    color: var(--p-text-muted-color, var(--p-grey-2));
}

.requests-mobile-paginator {
    padding-bottom: var(--app-mobile-bottom-offset);
}

.clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

@media (max-width: 768px) {
    .content-wrapper {
        padding: 20px;
    }
    .card-text {
        font-size: 0.74rem;
        font-family: 'SF Pro Rounded', sans-serif;
        color: var(--p-grey-1);
        text-wrap: wrap;
    }
    h2 {
        font-size: 18px;
    }

    .requests-mobile-toolbar,
    .requests-card-head,
    .requests-card-footer {
        flex-direction: column;
        align-items: flex-start;
    }

    .requests-mobile-toolbar-actions {
        width: 100%;
        justify-content: flex-end;
    }

    .requests-mobile-toolbar-actions :deep(.p-button) {
        flex: 1;
    }

    .requests-mobile-summary,
    .requests-mobile-filter-actions {
        grid-template-columns: 1fr;
        display: grid;
    }

    .requests-card-footer {
        align-items: stretch;
    }

    .requests-card-footer :deep(.p-button) {
        width: 100%;
    }
}
</style>
