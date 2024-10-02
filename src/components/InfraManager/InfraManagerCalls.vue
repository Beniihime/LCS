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
                            <h4><i class="pi pi-user"></i> Основная информация</h4>
                            <p><strong>Заявка:</strong> {{ selectedCall.fullName }}</p>
                            <p><strong>Описание:</strong> {{ selectedCall.description }}</p>
                            <p><strong>Решение:</strong> {{ selectedCall.solution }}</p>
                            <p><strong>Категория сервиса:</strong> {{ selectedCall.serviceCategoryName }}</p>
                        </div>

                        <!-- Даты -->
                        <div class="details-section">
                            <h4><i class="pi pi-calendar"></i> Даты</h4>
                            <p><strong>Дата регистрации:</strong> {{ formatDate(selectedCall.utcDateRegistered) }}</p>
                            <p><strong>Дата открытия:</strong> {{ formatDate(selectedCall.utcDateOpened) }}</p>
                            <p><strong>Дата обещанного выполнения:</strong> {{ formatDate(selectedCall.utcDatePromised) }}</p>
                            <p><strong>Дата выполнения:</strong> {{ formatDate(selectedCall.utcDateAccomplished) }}</p>
                            <p><strong>Дата закрытия:</strong> {{ formatDate(selectedCall.utcDateClosed) }}</p>
                            <p><strong>Дата последнего изменения:</strong> {{ formatDate(selectedCall.utcDateModified) }}</p>
                        </div>

                        <!-- Сервис -->
                        <div class="details-section">
                            <h4><i class="pi pi-cog"></i> Сервис</h4>
                            <p><strong>Сервис:</strong> {{ selectedCall.serviceName }}</p>
                            <p><strong>Место сервиса:</strong> {{ selectedCall.servicePlaceName }}</p>
                            <p><strong>Элемент сервиса:</strong> {{ selectedCall.serviceItemName }}</p>
                            <p><strong>Исполнитель:</strong> {{ selectedCall.serviceAttendanceName }}</p>
                        </div>

                        <!-- Статусы и приоритет -->
                        <div class="details-section">
                            <h4><i class="pi pi-exclamation-circle"></i> Статус и приоритет</h4>
                            <p><strong>Тип заявки:</strong> {{ selectedCall.callType }}</p>
                            <p><strong>Статус:</strong> {{ selectedCall.entityStateName }}</p>
                            <p><strong>Тип приема:</strong> {{ selectedCall.receiptTypeName }}</p>
                            <p><strong>Срочность:</strong> {{ selectedCall.urgencyName }}</p>
                            <p><strong>Влияние:</strong> {{ selectedCall.influenceName }}</p>
                            <p><strong>Приоритет:</strong> {{ selectedCall.priorityName }}</p>
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
const isCollapsed = ref(false);  // Состояние сворачивания/разворачивания списка

// Открыть модальное окно с информацией по заявке
const openCallDetails = async (callId) => {
  try {
    const response = await axiosInstance.get(`/api/infra-manager/users/me/calls/${callId}`);
    selectedCall.value = response.data;
    isDialogVisible.value = true;
  } catch (error) {
    console.error('Ошибка при загрузке информации о заявке:', error);
  }
};

// Переключение состояния сворачивания/разворачивания списка
const toggleCallsVisibility = () => {
  isCollapsed.value = !isCollapsed.value;
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
  padding: 10px;
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
}
h2 {
    margin-bottom: 5px;
    font-size: 24px;
    font-weight: bold;
}
</style>