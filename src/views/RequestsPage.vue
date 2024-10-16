<template>
    <main>
        <WelcomeScreen :visible="loading" />
        <div class="content-wrap">
            <DataTable
                :value="calls"
                paginator
                :rows="rowsPerPage"
                :totalRecords="totalRecords"
                scrollable
                removableSort
                stripedRows
                style="max-width: 86rem;"
                scrollHeight="875px"
                @page="onPage"
                :rowClass="rowClass"
            >
                <template #header>
                    <div class="row justify-content-between align-items-center">
                        <div class="col d-flex justify-content-start">
                            <!-- <Button class="toggle-button" label="Доступные сервисы"/> -->
                            <InfraManagerServices />
                        </div>
                        <div class="col d-flex justify-content-center">
                            <h3 class="title m-0">Ваши заявки</h3>
                        </div>
                        <div class="col d-flex justify-content-end">
                            <Button rounded icon="pi pi-plus" outlined/>
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
        <InfraManagerCallsMe ref="callDetailsRef" class="position-absolute opacity-0" style="z-index: -999;"/>
    </main>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import axiosInstance from '@/utils/axios.js';

import InfraManagerCallsMe from '@/components/InfraManager/InfraManagerCallsMe.vue';
import InfraManagerServices from '@/components/InfraManager/InfraManagerServices.vue';
import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';

const loading = ref(true);

const selectedUser = ref(null);
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

// Загрузка заявок (по страницам)
const fetchCalls = async () => {
    loading.value = true;
    calls.value = [];

    try {
        const response = await axiosInstance.get('/api/infra-manager/users/me/calls', {
            params: {
                take: 100,
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
        const response = await axiosInstance.get('/api/infra-manager/users/me/calls', {
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

const openCallDetails = (id) => { nextTick(() => { callDetailsRef.value?.openCallDetails(id); }); };

onMounted(async () => {
    await fetchCalls();
});
</script>

<style scoped>
main {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}
.content-wrap {
    flex-grow: 1;
    padding: 10pt 5rem;
    color: var(--p-text-color);
    transition: all 0.5s;
}
.openCall:hover {
    text-decoration: underline;
    cursor: pointer;
}
.pi {
    font-size: 2rem;
}
</style>