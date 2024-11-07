<template>
    <div class="content">
        <WelcomeScreen :visible="loading" />
        <div class="content-wrap">
            <DataTable
                v-if="!loading"
                :value="calls"
                paginator
                :rows="rowsPerPage"
                :totalRecords="totalRecords"
                scrollable
                scrollHeight="84.1vh"
                removableSort
                stripedRows
                @page="onPage"
                :rowClass="rowClass"
                @row-click="(event) => openCallDetails(event.data.id)"
            >
                <template #header>
                    <div class="row justify-content-between align-items-center">
                        <div class="col d-flex justify-content-start">
                            <InfraManagerServices />
                        </div>
                        <div class="col d-flex justify-content-center">
                            <h3 class="title m-0">Ваши заявки</h3>
                        </div>
                        <div class="col d-flex justify-content-end">
                            <Button rounded icon="pi pi-plus" outlined @click="redirect"/>
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
                <Column field="number" header="#" sortable style="min-width: 50px" class="openCall">
                    <template #body="{ data }">
                        {{ data.number }}
                    </template>
                </Column>
                <Column field="entityStateName" header="Статус" style="min-width: 100px;">
                    <template #body="{ data }">
                        <Tag :value="data.entityStateName" :severity="getStatusSeverity(data.entityStateName)" :icon="getStatusIcon(data.entityStateName)"/>
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

                <Column field="serviceAttendanceFullName" header="Выполнил" sortable style="min-width: 150px">
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

            <Skeleton v-else width="100%" height="90vh" class="skeleton-table" />
        </div>
        <InfraManagerCallsMe ref="callDetailsRef" class="position-absolute opacity-0" style="z-index: -999;"/>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import axiosInstance from '@/utils/axios.js';

import InfraManagerCallsMe from '@/components/InfraManager/InfraManagerCallsMe.vue';
import InfraManagerServices from '@/components/InfraManager/InfraManagerServices.vue';
import WelcomeScreen from '@/components/Utils/WelcomeScreen.vue';

const loading = ref(true);

const calls = ref([]);  // Все загруженные заявки
const currentPage = ref(1);  // Текущая страница
const rowsPerPage = ref(10);  // Количество строк на странице
const totalRecords = ref(0);  // Общее количество заявок
const totalPages = ref(0);
const loadedPages = ref(10);

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

const redirect = () => {
    window.location.href="https://sibadi.org/it-services/?login=yes";
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

// Загрузка заявок (по страницам)
const fetchCalls = async () => {
    try {
        loading.value = true;
        const response = await axiosInstance.get('/api/infra-manager/users/me/calls', {
            params: {
                page: 1,
                pageSize: rowsPerPage.value * 10,
            },
        });

        if (response.data?.entities) {
            calls.value = response.data.entities;
            totalRecords.value = response.data.countAllEntities;
            totalPages.value = response.data.countAllPages;
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

const callDetailsRef = ref(null); // Ссылка на дочерний компонент InfraManagerCalls

const openCallDetails = (id) => { nextTick(() => { callDetailsRef.value?.openCallDetails(id); }); };

onMounted(async () => {
    await fetchCalls();
});
</script>

<style scoped>
.content {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    height: 100vh;
}
.content-wrap {
    flex-grow: 1;
    align-content: center;
    padding: 10px 10px;
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
.search {
    border-radius: 12pt;
    font-size: 18px;
    transition: all 0.5s;
}
.skeleton-table {
  border-radius: 18px;
  background-color: var(--p-grey-3);
}
</style>