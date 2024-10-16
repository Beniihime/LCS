<template>
    <main>
        <WelcomeScreen :visible="loading" />
        <div class="content-wrapper">
            <h1 class="mb-4">Микросервисы</h1>
            <div class="services-cards">
                <div class="card h-100">
                    <div class="row">
                        <div class="col">
                            <div class="card-body">
                                <div class="row mb-4 align-items-center justify-content-between">
                                    <div class="col-auto">
                                        <div class="header">
                                            <h2>InfraManager</h2>
                                            <h5 class="card-text">Управление системой автоматизации ИТ-процессов</h5>
                                        </div>
                                    </div>
                                    <div class="col-auto">
                                        <Button type="button" icon="pi pi-ellipsis-v" @click="toggle" aria-haspopup="true" aria-controls="overlay_menu" severity="secondary"/>
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
                <div class="col">
                    <Button :label="collapsed ? 'Показать таблицу' : 'Скрыть'" :icon="collapsed ? 'pi pi-angle-down' : 'pi pi-angle-up'" iconPos="right"  class="toggle-button" severity="secondary" @click="toggleTable" />
                    <div :class="['table-container', { open: !collapsed }]">
                        <DataTable
                            :value="calls"
                            paginator
                            :rows="rowsPerPage"
                            :totalRecords="totalRecords"
                            scrollable
                            removableSort
                            stripedRows
                            style="max-width: 81rem;"
                            scrollHeight="620px"
                            @page="onPage"
                            :rowClass="rowClass"
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
                                    <!-- {{ data.documentCount }} -->
                                    <!-- <i class="pi pi-file"></i> -->
                                    <OverlayBadge :value="data.documentCount" :severity="data.documentCount ? 'danger' : 'secondary'">
                                        <i class="pi pi-file" style="font-size: 2rem" />
                                    </OverlayBadge>
                                </template>
                            </Column>
                            <Column field="number" header="#" sortable style="min-width: 50px">
                                <template #body="{ data }">
                                    <div @click="openCallDetails(data.id)" class="openCall" v-if="!data.removed">
                                        {{ data.number }}
                                    </div>
                                    <div v-else style="cursor: not-allowed;">
                                        {{ data.number }}
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
                            <Column field="callSummaryName" header="Сводка" style="min-width: 150px">
                                <template #body="{ data }">
                                    {{ data.callSummaryName }}
                                </template>
                            </Column>
                            <Column field="serviceItemFullName" header="Элемент сервиса" style="min-width: 350px">
                                <template #body="{ data }">
                                    {{ data.serviceItemFullName }}
                                </template>
                            </Column>

                            <Column field="serviceAttendanceFullName" header="Исполнитель сервиса" sortable style="min-width: 150px">
                                <template #body="{ data }">
                                    {{ data.serviceAttendanceFullName }}
                                </template>
                            </Column>
                            <Column field="serviceName" header="Сервис" style="min-width: 250px">
                                <template #body="{ data }">
                                    {{ data.serviceName }}
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
                            <Column field="priorityName" header="Приоритет" style="min-width: 100px">
                                <template #body="{ data }">
                                    {{ data.priorityName }}
                                </template>
                            </Column>
                            <Column field="utcDateRegistered" header="Дата регистрации" sortable style="min-width: 290px">
                                <template #body="{ data }">
                                    {{ formatDate(data.utcDateRegistered) }}
                                </template>
                            </Column>
                            <Column field="utcDateModified" header="Дата изменения" style="min-width: 290px">
                                <template #body="{ data }">
                                    {{ formatDate(data.utcDateModified) }}
                                </template>
                            </Column>
                            <Column field="utcDateClosed" header="Дата закрытия" style="min-width: 290px">
                                <template #body="{ data }">
                                    {{ formatDate(data.utcDateClosed) }}
                                </template>
                            </Column>
                            <Column field="entityStateName" header="Статус" style="min-width: 100px;">
                                <template #body="{ data }">
                                    <Tag :value="data.entityStateName" :severity="getStatusSeverity(data.entityStateName)" :icon="getStatusIcon(data.entityStateName)" />
                                </template>
                            </Column>

                            <template #paginatorstart>
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>Всего заявок: {{ displayedRowsCount }}</div>
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
import { ref, onMounted, nextTick, computed } from 'vue';
import axiosInstance from '@/utils/axios.js';

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
const totalEntities = ref(0);  // Общее количество заявок для серверной пагинации
const totalPages = ref(0);

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

const formatDate = (dateStr) => {
    if (!dateStr) return ''; // Если дата пустая
    const date = new Date(dateStr);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('ru-RU', options);
}

const rowClass = (data) => {
    return [{ 'removed-row': data.removed }];
};

const searchUsers = async (event) => {
    try {
        const response = await axiosInstance.get('/api/infra-manager/users', {
            params: { patternSearch: event.query }
        });

        userSuggestions.value = response.data; // Список пользователей для AutoComplete
    } catch (error) {
        console.error('Ошибка при поиске пользователей: ', error);
    }
}

// Загрузка заявок (по страницам)
const fetchCalls = async () => {
    loading.value = true;
    calls.value = [];

    try {
        const response = await axiosInstance.get('/api/infra-manager/calls', {
            params: {
                take: 100,
                initiatorIdOrClientId: selectedUser.value?.id || undefined,
            },
        });

        const newCalls = response.data.calls || response.data;
        calls.value = newCalls;  // Сохраняем все загруженные заявки
        totalEntities.value = response.data.length;  // Общее количество заявок
        totalRecords.value = response.data.total || newCalls.length;
        totalPages.value = Math.ceil(totalRecords.value / rowsPerPage.value);
    } catch (error) {
        console.error('Ошибка при загрузке заявок:', error);
    } finally {
        loading.value = false;  // Завершение загрузки
    }
};

// При изменении страницы
const onPage = (event) => {
    currentPage.value = event.page + 1;
    rowsPerPage.value = event.rows;

    totalPages.value = Math.ceil(totalRecords.value / rowsPerPage.value);

    // Проверяем, если изменилось количество строк на странице, начинаем с первой страницы
    if (currentPage.value > totalPages.value) {
        currentPage.value = 1;
    }

    // Проверяем, находимся ли на последней странице
    if (currentPage.value === totalPages.value) {
        fetchNextCalls();  // Загружаем данные только если на последней странице
    }
};

const fetchNextCalls = async () => {
    loading.value = true;

    try {
        const response = await axiosInstance.get('/api/infra-manager/calls', {
            params: {
                skip: calls.value.length,  // Пропускаем уже загруженные
                take: 100,  // Загружаем количество данных, равное количеству строк на странице
                initiatorIdOrClientId: selectedUser.value?.id || undefined,
            },
        });

        const newCalls = response.data.calls || response.data;
        calls.value.push(...newCalls);  // Добавляем новые заявки к уже загруженным
        totalRecords.value += newCalls.length; 

        totalPages.value = Math.ceil(totalRecords.value / rowsPerPage.value);
    } catch (error) {
        console.error('Ошибка при загрузке следующих заявок:', error);
    } finally {
        loading.value = false;
    }
};

// Вычисляем количество отображаемых строк
const displayedRowsCount = computed(() => {
    const start = (currentPage.value - 1) * rowsPerPage.value;
    const end = start + rowsPerPage.value;
    return calls.value.slice(start, end).length;
});

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

onMounted(() => {
    fetchCalls();
});

</script>

<style scoped>
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
    padding: 20px 8rem;
    overflow: hidden;
    color: var(--p-text-color);
}
.card-text {
    font-size: 1.3rem;
    font-family: 'SF Pro Rounded', sans-serif;
    color: var(--p-grey-1);
    margin-top: 20px;
}
.card {
    border-radius: 18px;
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
    font-size: 14pt;
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
</style>