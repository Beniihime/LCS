<template>
    <main>
        <WelcomeScreen :visible="loading" />
        <div class="content-wrapper">
            <div v-if="showScrollHint" class="scroll-hint" @click="hideScrollHint">
                Прокрутите таблицу влево или вправо, чтобы увидеть больше данных.
            </div>
            <h2 class="mb-4">Микросервисы</h2>
            <div class="services-cards">
                <div class="card h-100">
                    <div class="row">
                        <div class="col">
                            <div class="card-body">
                                <div class="row mb-1 align-items-center justify-content-between">
                                    <div class="col-auto">
                                        <div class="header">
                                            <h3>InfraManager</h3>
                                            <h5 class="card-text">Управление системой автоматизации ИТ-процессов</h5>
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <Button class="action" type="button" icon="pi pi-ellipsis-v" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu" severity="secondary"/>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-auto">
                                        <Menu ref="menu" :model="menuItems" :popup="true" id="overlay_menu"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <InfraManagerCreate ref="infraCreateRef"/>
                <InfraManagerDelete ref="infraDeleteRef"/>
                <InfraManagerSearchUsers ref="infraSearchRef"/>
            </div>
            <div class="row">
                <div class="col" style="overflow: auto;">
                    <Button :label="collapsed ? 'Показать таблицу' : 'Скрыть'" :icon="collapsed ? 'pi pi-angle-down' : 'pi pi-angle-up'" iconPos="right"  class="toggle-button" severity="secondary" @click="toggleTable" />
                    <div :class="['table-container', { open: !collapsed }]">
                        <DataTable
                            :value="calls"
                            :filters="filters"
                            filterDisplay="row"
                            paginator
                            :rows="rowsPerPage"
                            :totalRecords="totalRecords"
                            scrollable
                            removableSort
                            stripedRows
                            rowHover
                            scrollHeight="59vh"
                            @page="onPage"
                            :rowClass="rowClass"
                            @row-click="(event) => openCallDetails(event.data.id)"
                        >
                            <template #header>
                                <div class="d-flex justify-content-between align-items-center">
                                    <h3 class="title m-0">
                                        Заявки
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
                            <Column field="entityStateName" header="Статус" :showFilterMenu="false" style="min-width: 100px;">
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
                            <Column field="priorityName" header="Приоритет" :showFilterMenu="false" style="min-width: 100px">
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
                                        optionLabel="label"
                                        optionValue="value"
                                        class="search mx-1 px-1"
                                    />
                                    <span>строк</span>
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
        <InfraManagerCalls ref="callDetailsRef" class="position-absolute opacity-0"/>
    </main>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, reactive } from 'vue';
import axiosInstance from '@/utils/axios.js';
import { useRoute, useRouter } from 'vue-router';
import { debounce } from 'lodash';
import qs from 'qs';

import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';
import InfraManagerCreate from '@/components/InfraManager/InfraManagerCreate.vue';
import InfraManagerSearchUsers from '@/components/InfraManager/InfraManagerSearchUsers.vue';
import InfraManagerDelete from '@/components/InfraManager/InfraManagerDelete.vue';
import InfraManagerCalls from '@/components/InfraManager/InfraManagerCalls.vue';

const loading = ref(true);
const collapsed = ref(true); // Переменная для сворачивания таблицы

// Функция для смены состояния таблицы
const toggleTable = () => {
  collapsed.value = !collapsed.value;
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
                number: route.query.number || null,
                callSummaryName: route.query.callSummaryName || null,
                serviceName: route.query.serviceName || null,
                priorityId: route.query.priorityId || null,
                entityStateNames: route.query.entityStateNames || []
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
};

const resetPagination = () => {
    currentPage.value = 1;
    loadedPages.value = 10;
    calls.value = [];
}

// При изменении страницы
const onPage = async (event) => {
    const newRowsPerPage = event.rows;

    // Если изменилось количество строк на странице, сбросить пагинацию
    if (newRowsPerPage !== rowsPerPage.value) {
        rowsPerPage.value = newRowsPerPage;
        resetPagination();
        await fetchCalls();
    } else {
        currentPage.value = event.page + 1;

        // Подгружаем дополнительные страницы, если достигли конца загруженных данных
        if (currentPage.value = loadedPages.value) {
            await loadMorePages();
        }
    }
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
    entityStateNames: route.query.entityStateNames || []
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

const menu = ref();
const menuItems = ref([{
    label: 'Действия',
    items: [
        { label: 'Связка пользователей', icon: 'pi pi-link', command: () => { showCreateDialog() } },
        { label: 'Удаление связи', icon: 'pi pi-trash', command: () => { showDeleteDialog() } },
        { label: 'Поиск пользоватлей', icon: 'pi pi-user', command: () => { showSearchDialog() } },
    ]
}]);

const openCallDetails = (id) => { nextTick(() => { callDetailsRef.value?.openCallDetails(id); }); };

const toggle = (event) => {
    menu.value.toggle(event);
};

const infraCreateRef = ref(null); // InfraManagerCreate
const infraDeleteRef = ref(null); // InfraManagerDelete
const infraSearchRef = ref(null); // InfraManagerSearchUsers

// Вызываем метод для открытия диалога в дочернем компоненте
const showCreateDialog = () => { nextTick(() => { infraCreateRef.value?.openDialogCreate(); }); };
const showDeleteDialog = () => { nextTick(() => { infraDeleteRef.value?.openDialogDelete(); }); };
const showSearchDialog = () => { nextTick(() => { infraSearchRef.value?.openDialogSearch(); }); };

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
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.scroll-hint {
    position: absolute;
    top: 20px;
    right: 50%;
    transform: translateX(50%);
    background: var(--p-blue-500);
    color: var(--p-text-color);
    padding: 10px 20px;
    border-radius: 8px;
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
.content-wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 20px 8rem;
    overflow: hidden;
    color: var(--p-text-color);
}
.card-text {
    font-size: 1.15rem;
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-grey-1);
    margin-top: 10px;
}
.card {
    border-radius: 12px;
    transition: all 0.5s;
    background-color: transparent;
    color: var(--p-text-color);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
    border: 0;
}
.card-body {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}
.toggle-button {
    border-radius: 12px;
    transition: all 0.5s;
    width: 100%; 
    padding: 0;
    margin-bottom: 10px;
}
.table-container {
    transform-origin: top;
    transition: transform 0.3s, opacity 0.3s;
    transform: scaleY(0); /* По умолчанию скрываем */
    opacity: 0;
    height: auto; /* Высота будет динамической */
}

.table-container.open {
    transform: scaleY(1); /* Открываем элемент */
    opacity: 1;
}
.openCall:hover {
    text-decoration: underline;
    cursor: pointer;
}
.pi {
    font-size: 2rem;
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
   
}
</style>