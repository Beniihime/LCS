<template>
    <div class="">
        <!-- Заявки InfraManager -->
        <div class="service-card mt-3">
            <h2>Последние заявки</h2>
            <Divider />

            <div class="microservice-card">
                <div v-for="call in lastCalls" :key="call.id" class="call-card" @click="openCallDetails(call.id)">
                    <h4>Заявка №{{ call.number }}</h4>
                    <p>{{ call.callSummaryName }}</p>
                    <p><strong>Описание:</strong> {{ call.description }}</p>
                    <p><strong>Сервис:</strong> {{ call.serviceItemAttendanceFullName }}</p>
                </div>
            </div>

            <!-- Модальное окно для подробной информации -->
            <Dialog v-model:visible="isDialogVisible" modal :style="{ 'max-width': '70rem' }" @hide="closeDialog">
                <template v-if="selectedCall">
                    <h3 class="dialog-title">Заявка №{{ selectedCall.number }}</h3>
                    <Divider />
                    
                    <div class="call-details">
                    <!-- Основная информация -->
                    <div class="details-section">
                        <h4><i class="pi pi-info-circle"></i> Основная информация</h4>
                        <p v-if="selectedCall.fullName"><strong>Заявка:</strong> {{ selectedCall.fullName }}</p>
                        <p v-if="selectedCall.description"><strong>Описание:</strong> {{ selectedCall.description }}</p>
                        <p v-if="selectedCall.solution"><strong>Решение:</strong> {{ selectedCall.solution }}</p>
                        <p v-if="selectedCall.serviceCategoryName"><strong>Категория сервиса:</strong> {{ selectedCall.serviceCategoryName }}</p>
                    </div>

                    <!-- Даты -->
                    <div class="details-section">
                        <h4><i class="pi pi-calendar"></i> Даты</h4>
                        <p v-if="selectedCall.utcDateRegistered"><strong>Дата регистрации:</strong> {{ formatDate(selectedCall.utcDateRegistered) }}</p>
                        <p v-if="selectedCall.utcDateOpened"><strong>Дата открытия:</strong> {{ formatDate(selectedCall.utcDateOpened) }}</p>
                        <p v-if="selectedCall.utcDatePromised"><strong>Дата обещанного выполнения:</strong> {{ formatDate(selectedCall.utcDatePromised) }}</p>
                        <p v-if="selectedCall.utcDateAccomplished"><strong>Дата выполнения:</strong> {{ formatDate(selectedCall.utcDateAccomplished) }}</p>
                        <p v-if="selectedCall.utcDateClosed"><strong>Дата закрытия:</strong> {{ formatDate(selectedCall.utcDateClosed) }}</p>
                        <p v-if="selectedCall.utcDateModified"><strong>Дата последнего изменения:</strong> {{ formatDate(selectedCall.utcDateModified) }}</p>
                    </div>

                    <!-- Сервис -->
                    <div class="details-section">
                        <h4><i class="pi pi-cog"></i> Сервис</h4>
                        <p v-if="selectedCall.serviceName"><strong>Сервис:</strong> {{ selectedCall.serviceName }}</p>
                        <p v-if="selectedCall.servicePlaceName"><strong>Место сервиса:</strong> {{ selectedCall.servicePlaceName }}</p>
                        <p v-if="selectedCall.serviceItemName"><strong>Элемент сервиса:</strong> {{ selectedCall.serviceItemName }}</p>
                        <p v-if="selectedCall.serviceAttendanceName"><strong>Исполнитель:</strong> {{ selectedCall.serviceAttendanceName }}</p>
                    </div>

                    <!-- Статусы и приоритет -->
                    <div class="details-section">
                        <h4><i class="pi pi-exclamation-circle"></i> Статус и приоритет</h4>
                        <p v-if="selectedCall.callType"><strong>Тип заявки:</strong> {{ selectedCall.callType }}</p>
                        <p v-if="selectedCall.entityStateName"><strong>Статус:</strong> {{ selectedCall.entityStateName }}</p>
                        <p v-if="selectedCall.receiptTypeName"><strong>Тип приема:</strong> {{ selectedCall.receiptTypeName }}</p>
                        <p v-if="selectedCall.urgencyName"><strong>Срочность:</strong> {{ selectedCall.urgencyName }}</p>
                        <p v-if="selectedCall.influenceName"><strong>Влияние:</strong> {{ selectedCall.influenceName }}</p>
                        <p v-if="selectedCall.priorityName"><strong>Приоритет:</strong> {{ selectedCall.priorityName }}</p>
                    </div>

                    <!-- Ответственные -->
                    <div class="details-section">
                      <h4><i class="pi pi-user"></i> Ответственные</h4>
                      <p v-if="selectedCall.initiatorFullName"><strong>Инициатор:</strong> {{ selectedCall.initiatorFullName }}</p>
                      <p v-if="selectedCall.clientFullName"><strong>Клиент:</strong> {{ selectedCall.clientFullName }}</p>
                      <p v-if="selectedCall.ownerFullName"><strong>Владелец:</strong> {{ selectedCall.ownerFullName }}</p>
                      <p v-if="selectedCall.executorFullName"><strong>Исполнитель:</strong> {{ selectedCall.executorFullName }}</p>
                      <p v-if="selectedCall.accomplisherFullName"><strong>Выполнивший:</strong> {{ selectedCall.accomplisherFullName }}</p>
                    </div>
                </div>

                    
                    
                </template>
            </Dialog>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axiosInstance from '@/utils/axios.js';

import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Divider from 'primevue/divider';

const lastCalls = ref([]);  // Список последних заявок
const isDialogVisible = ref(false);  // Видимость модального окна
const selectedCall = ref(null);  // Выбранная заявка

// Открыть модальное окно с информацией по заявке
const openCallDetails = async (callId) => {
  try {
    const response = await axiosInstance.get(`/api/infra-manager/users/me/calls/${callId}`);
    const callData = response.data;

    // Делаем параллельные запросы для всех ID
    const requests = [];

    if (callData.initiatorID) {
      requests.push(axiosInstance.get(`/api/infra-manager/users/${callData.initiatorID}`));
    } else {
      requests.push(Promise.resolve({ data: { fullName: null } }));
    }

    if (callData.clientID) {
      requests.push(axiosInstance.get(`/api/infra-manager/users/${callData.clientID}`));
    } else {
      requests.push(Promise.resolve({ data: { fullName: null } }));
    }

    if (callData.ownerID) {
      requests.push(axiosInstance.get(`/api/infra-manager/users/${callData.ownerID}`));
    } else {
      requests.push(Promise.resolve({ data: { fullName: null } }));
    }

    if (callData.executorID) {
      requests.push(axiosInstance.get(`/api/infra-manager/users/${callData.executorID}`));
    } else {
      requests.push(Promise.resolve({ data: { fullName: null } }));
    }

    if (callData.accomplisherID) {
      requests.push(axiosInstance.get(`/api/infra-manager/users/${callData.accomplisherID}`));
    } else {
      requests.push(Promise.resolve({ data: { fullName: null } }));
    }

    // Выполняем все запросы
    const [initiator, client, owner, executor, accomplisher] = await Promise.all(requests);

    // Обновляем заявку с именами пользователей
    selectedCall.value = {
      ...callData,
      initiatorFullName: initiator.data.fullName || '',
      clientFullName: client.data.fullName || '',
      ownerFullName: owner.data.fullName || '',
      executorFullName: executor.data.fullName || '',
      accomplisherFullName: accomplisher.data.fullName || '',
    };

    // Открываем модальное окно
    isDialogVisible.value = true;
  } catch (error) {
    console.error('Ошибка при загрузке информации о заявке:', error);
  }
};

// Закрыть модальное окно
const closeDialog = () => {
  isDialogVisible.value = false;
  selectedCall.value = null;
};

// Форматировать дату
const formatDate = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
};

const fetchCallsInfo = async () => {
    // Загружаем последние 10 заявок
    try {
        const callsResponse = await axiosInstance.get('/api/infra-manager/users/me/calls');
        lastCalls.value = callsResponse.data;
    } catch (error) {
        console.error('Ошибка при загрузке информации о заявке: ', error);
    }

}

onMounted(() => {
    fetchCallsInfo();
})
</script>

<style scoped>
.service-card .call-card {
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid var(--p-grey-3);
    border-radius: 10px;
    background-color: var(--p-grey-5);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.5s ease;
    cursor: pointer;
}
.service-card {
    background-color: var(--p-grey-6);
    border-radius: 24px;
    border: 2px solid var(--p-grey-4);
    transition: all 0.5s ease;
    width: 100%;
    padding: 30px;
}
.slide-fade-enter-active, .slide-fade-leave-active {
    transition: all 0.5s ease;
}
.slide-fade-enter-from, .slide-fade-leave-to {
    transform: translateY(20px);
    opacity: 0;
}
.dialog-title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 1.5em;
}
.call-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.details-section {
  padding: 20px;
  border: 1px solid var(--p-grey-3);
  border-radius: 10px;
  background-color: var(--p-grey-8);
}
.details-section h4 {
  margin-top: 0;
  font-size: 1.2em;
}
.details-section p {
  margin: 5px 0;
}
.pi {
  margin-right: 10px;
  color: var(--primary-color);
  font-size: 1.4rem;
}
h2 {
    margin-bottom: 5px;
    font-size: 24px;
    font-weight: bold;
}
</style>