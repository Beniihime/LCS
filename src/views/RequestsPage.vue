<template>
    <div class="content">
        <WelcomeScreen :visible="loading" />
        <div class="content-wrap">

            <!-- Подсказка для прокрутки таблицы -->
            <div v-if="showScrollHint" class="scroll-hint" @click="hideScrollHint">
                Прокрутите таблицу вправо, чтобы увидеть больше данных.
            </div>

            <DataTable
                v-if="!loading"
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
                    <div class="row justify-content-between align-items-center">
                        <div class="col d-flex justify-content-start">
                            <h3 class="title m-0">Ваши заявки</h3>
                        </div>
                        <div class="col d-flex justify-content-end">
                            <CreateRequest @refreshRequests="(id) => fetchCalls(id)"/>
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
                <Column field="number" header="#" sortable :showFilterMenu="false" style="min-width: 180px" class="openCall">
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
                <Column field="entityStateName" header="Статус" sortable :showFilterMenu="false" style="max-width: 200px;">
                    <template #body="{ data }">
                        <Tag :value="data.entityStateName" :severity="getStatusSeverity(data.entityStateName)" :icon="getStatusIcon(data.entityStateName)"/>
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
                <Column field="priorityName" header="Приоритет" sortable :showFilterMenu="false" style="max-width: 160px">
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
                <Column field="callSummaryName" header="Сводка" :showFilterMenu="false" style="min-width: 150px">
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
                <Column field="solution" header="Решение" style="max-width: 150px;">
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
                <Column field="serviceName" header="Сервис" :showFilterMenu="false" style="max-width: 250px">
                    <template #body="{ data }">
                        <div style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" v-tooltip="{ value: data.serviceName, showDelay: 800, hideDelay: 300 }">{{ data.serviceName }}</div>
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
                            optionLabel="label"
                            optionValue="value"
                            class="search mx-1 px-1"
                        />
                        <span>строк</span>
                    </div>
                </template>
            </DataTable>

            <Skeleton v-else width="100%" height="100%" class="skeleton-table" />
        </div>
        <InfraManagerCallsMe ref="callDetailsRef" class="position-absolute opacity-0" style="z-index: -999;"/>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import qs from 'qs';
import axiosInstance from '@/utils/axios.js';

import InfraManagerCallsMe from '@/components/InfraManager/InfraManagerCallsMe.vue';
import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';
import CreateRequest from '@/components/InfraManager/CreateRequest.vue';

const loading = ref(true);

const calls = ref([]);  // Все загруженные заявки
const currentPage = ref(1);  // Текущая страница
const rowsPerPage = ref(10);  // Количество строк на странице
const totalRecords = ref(0);  // Общее количество заявок
const totalPages = ref(0);
const loadedPages = ref(10);

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

// Получение цвета статуса
const getStatusSeverity = (status) => {
  switch (status) {
    case 'Открыта':
      return 'info';
    case 'Закрыта':
      return 'success';
    case 'Ожидает':
      return 'secondary';
    case 'Зарегистрирована':
      return 'warn';
    case 'Инициирована':
      return '';
    default:
      return null;
  }
}

// Получение иконки статуса
const getStatusIcon = (status) => {
  switch (status) {
    case 'Открыта':
      return 'pi pi-info-circle';
    case 'Закрыта':
      return 'pi pi-check';
    case 'Ожидает':
      return 'pi pi-hourglass';
    case 'Зарегистрирована':
      return 'pi pi-book';
    case 'Инициирована':
      return 'pi pi-eject';
    default:
      return null;
  }
}

const formatUTCToOmsk = (utcString) => {
  if (!utcString) return '';

  // Добавляем 'Z', чтобы обозначить, что строка — в формате UTC
  const date = new Date(`${utcString}Z`);

  // Добавляем 6 часов для Омского времени
  date.setHours(date.getUTCHours() + 6);

  // Форматируем дату с учётом 24-часового формата и Омского времени
  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
};

const rowClass = (data) => {
    return [{ 'removed-row': data.removed , 'not-allowed': data.removed, 'pointer': !data.removed, 'highlighted-row': data.id === lastCreatedId.value }];
};

const lastCreatedId = ref(null);

// Загрузка заявок (по страницам)
const fetchCalls = async (highlightId = null) => {
    try {
        loading.value = true;

        const response = await axiosInstance.get('/api/infra-manager/users/me/calls', {
            params: {
                page: 1,
                pageSize: rowsPerPage.value * 10,
                number: route.query.number || null,
                callSummaryName: route.query.callSummaryName || null,
                serviceName: route.query.serviceName || null,
                priorityId: route.query.priorityId || null,
                entityStateNames: route.query.entityStateNames || ['Инициирована', 'Открыта', 'Зарегистрирована', 'Ожидает']
            },
                
            paramsSerializer: (params) => {
                return qs.stringify(params, { arrayFormat: 'repeat' })
            }
        });

        if (response.data?.entities) {
            calls.value = response.data.entities;
            totalRecords.value = response.data.countAllEntities;
            totalPages.value = response.data.countAllPages;
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
                page: loadedPages.value / 10 + 1,
                pageSize: rowsPerPage.value * 10,
                number: route.query.number || null,
                callSummaryName: route.query.callSummaryName || null,
                serviceName: route.query.serviceName || null,
                priorityId: route.query.priorityId || null,
                entityStateNames: route.query.entityStateNames || []
            },
        });

        if (response.data?.entities) {
            calls.value.push(...response.data.entities);
            loadedPages.value += 10;
        }
    } catch (erorr) {
        console.debug('Ошибка при загрузке: ', error);
    }
}

// При изменении страницы
const onPage = async (event) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;

    if (currentPage.value === loadedPages.value) {
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


const callDetailsRef = ref(null); // Ссылка на дочерний компонент InfraManagerCalls

const openCallDetails = (id) => { nextTick(() => { callDetailsRef.value?.openCallDetails(id); }); };

const showScrollHint = ref(true);

const hideScrollHint = () => {
    showScrollHint.value = false;
};

onMounted(async () => {
    await fetchFilterOptions();
    setTimeout(() => {
        hideScrollHint();
    }, 8000);
});
</script>

<style scoped>
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
.openCall:hover {
    text-decoration: underline;
    cursor: pointer;
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
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
    z-index: 1000;
    cursor: pointer;
    animation: fadeInOut 5s forwards;
}
:deep(.p-datatable-tbody > tr:hover) {
    background-color: var(--p-blue-500-low-op) !important;
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