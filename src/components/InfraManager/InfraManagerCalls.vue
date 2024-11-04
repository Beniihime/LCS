<template>
    <div class="">
        <!-- Заявки InfraManager -->
        <div class="service-card mt-3">
            <h4><strong>Последние заявки</strong></h4>
            <Divider />

            <div class="microservice-card">
                <div v-for="call in lastCalls" :key="call.id" class="call-card" @click="openCallDetails(call.id)">
                    <h4>Заявка №{{ call.number }}</h4>
                    <p>{{ call.callSummaryName }}</p>
                    <p><strong>Описание:</strong> {{ call.description }}</p>
                    <p><strong>Решение:</strong> {{ call.solution }}</p>
                </div>
            </div>

            <!-- Модальное окно для подробной информации -->
            <Dialog v-model:visible="isDialogVisible" modal :style="{ 'min-width': '60rem', 'max-width': '100rem' }" @hide="closeDialog">
              <template v-if="errorOccurred">
                <div class="error-message">
                  <p>Произошла ошибка при загрузке данных</p>
                </div>
              </template>

              <template v-else-if="selectedCall">
                <h3 class="dialog-title">Заявка №{{ selectedCall.number }}</h3>
                <Tabs value="0">
                  <TabList>
                    <Tab value="0" as="div">
                      <i class="pi pi-cog"></i>
                      <span class="ms-2">Общее</span>
                    </Tab>
                    <Tab value="1" as="div">
                      <i class="pi pi-folder"></i>
                      <span class="ms-2">Файлы</span>
                    </Tab>
                    <Tab value="2" as="div">
                      <i class="pi pi-thumbs-up"></i>
                      <span class="ms-2">Согласование</span>
                    </Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel value="0">
                      <div class="call-details">
                        <!-- Основная информация -->
                        <div class="details-section">
                            <h4><i class="pi pi-info-circle"></i> Основная информация</h4>
                            <p v-if="selectedCall.fullName"><strong>Заявка:</strong> <span v-html="selectedCall.fullName"></span></p>
                            <p v-if="selectedCall.description"><strong>Описание:</strong> <span v-html="selectedCall.description"></span></p>
                            <p v-if="selectedCall.solution"><strong>Решение:</strong> <span v-html="selectedCall.solution"></span></p>
                            <p v-if="selectedCall.serviceCategoryName"><strong>Категория сервиса:</strong> <span v-html="selectedCall.serviceCategoryName"></span></p>
                        </div>

                        <!-- Даты -->
                        <div class="details-section">
                            <h4><i class="pi pi-calendar"></i> Даты</h4>
                            <Timeline :value="timelineEvents" class="mb-3">
                              <template #opposite="slotProps">
                                <small>{{ formatDate(slotProps.item.date) }}</small>
                              </template>
                              <template #content="slotProps">
                                <span>{{ slotProps.item.label }}</span>
                              </template>
                            </Timeline>
                            <p v-if="selectedCall.utcDatePromised"><strong>Дата обещанного выполнения:</strong> {{ formatDate(selectedCall.utcDatePromised) }}</p>
                            <p v-if="selectedCall.utcDateModified"><strong>Дата последнего изменения:</strong> {{ formatDate(selectedCall.utcDateModified) }}</p>
                        </div>

                        <!-- Сервис -->
                        <div class="details-section">
                            <h4><i class="pi pi-cog"></i> Сервис</h4>
                            <p v-if="selectedCall.serviceName"><strong>Сервис:</strong> <span v-html="selectedCall.serviceName"></span></p>
                            <p v-if="selectedCall.servicePlaceName"><strong>Место сервиса:</strong> <span v-html="selectedCall.servicePlaceName"></span></p>
                            <p v-if="selectedCall.serviceItemName"><strong>Элемент сервиса:</strong> <span v-html="selectedCall.serviceItemName"></span></p>
                            <p v-if="selectedCall.serviceAttendanceName"><strong>Исполнитель:</strong> <span v-html="selectedCall.serviceAttendanceName"></span></p>
                        </div>

                        <!-- Статусы и приоритет -->
                        <div class="details-section">
                            <h4><i class="pi pi-exclamation-circle"></i> Статус и приоритет</h4>
                            <p v-if="selectedCall.callType"><strong>Тип заявки:</strong> <span v-html="selectedCall.callType"></span></p>
                            <p v-if="selectedCall.entityStateName">
                              <strong>Статус:</strong> 
                              <Tag :value="selectedCall.entityStateName" :severity="getStatusSeverity(selectedCall.entityStateName)" :icon="getStatusIcon(selectedCall.entityStateName)" class="ms-3"/>
                            </p>
                            <p v-if="selectedCall.receiptTypeName"><strong>Тип приема:</strong> <span v-html="selectedCall.receiptTypeName"></span></p>
                            <p v-if="selectedCall.urgencyName"><strong>Срочность:</strong> <span v-html="selectedCall.urgencyName"></span></p>
                            <p v-if="selectedCall.influenceName"><strong>Влияние:</strong> <span v-html="selectedCall.influenceName"></span></p>
                            <p v-if="selectedCall.priorityName"><strong>Приоритет:</strong> <span v-html="selectedCall.priorityName"></span></p>
                        </div>

                        <!-- Ответственные -->
                        <div class="details-section">
                            <h4><i class="pi pi-user"></i> Ответственные</h4>
                            <p v-if="selectedCall.initiatorFullName"><strong>Инициатор:</strong> <span v-html="selectedCall.initiatorFullName"></span></p>
                            <p v-if="selectedCall.clientFullName"><strong>Клиент:</strong> <span v-html="selectedCall.clientFullName"></span></p>
                            <p v-if="selectedCall.ownerFullName"><strong>Владелец:</strong> <span v-html="selectedCall.ownerFullName"></span></p>
                            <p v-if="selectedCall.executorFullName"><strong>Исполнитель:</strong> <span v-html="selectedCall.executorFullName"></span></p>
                            <p v-if="selectedCall.accomplisherFullName"><strong>Выполнивший:</strong> <span v-html="selectedCall.accomplisherFullName"></span></p>
                        </div>
                      </div>
                    </TabPanel>
                    <TabPanel value="1">
                      <div v-if="documents.length > 0" class="documents-section">
                        <div v-for="document in documents" :key="document.id" class="document-card">
                          <div class="row align-items-center justify-content-between">
                            <div class="col-auto">
                              <h5>{{ document.name }}</h5>
                              <p>Размер: {{ formatFileSize(document.size) }}</p>
                              <p>Дата загрузки: {{ formatDate(document.utcDateCreated) }}</p>
                            </div>
                            <div class="col-auto">
                              <Button icon="pi pi-download" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <p v-else>Документы отсутствуют</p>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
                  
                
              </template>
              <template v-else>
                <div class="call-details">
                  <Skeleton width="530px" height="200px" class="mb-2"/>
                  <Skeleton width="530px" height="200px" class="mb-2"/>
                  <Skeleton width="530px" height="200px" class="mb-2"/>
                  <Skeleton width="530px" height="200px" class="mb-2"/>
                  <Skeleton width="530px" height="200px" class="mb-2"/>
                  <Skeleton width="530px" height="200px" class="mb-2"/>
                </div>
              </template>
            </Dialog>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, defineExpose } from 'vue';
import axiosInstance from '@/utils/axios.js';

// Пропс для передачи ID пользователя
const props = defineProps({
  userId: {
    type: String,
  }
});

const lastCalls = ref([]);  // Список последних заявок
const isDialogVisible = ref(false);  // Видимость модального окна
const selectedCall = ref(null);  // Выбранная заявка
const documents = ref([]); // Список документов для выбранной заявки
const errorOccurred = ref(false);

const timelineEvents = ref([]);

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

// Функция для форматирования размера файла
const formatFileSize = (size) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

// Функция для загрузки документов
const fetchDocuments = async (callId) => {
  try {
    const response = await axiosInstance.get(`/api/infra-manager/calls/${callId}/documents`);
    documents.value = response.data;
  } catch (error) {
    console.error('Ошибка при загрузке документов:', error);
  }
};

// Функция для получения последних заявок по ID пользователя
const fetchUserCalls = async () => {
    try {
        const callsResponse = await axiosInstance.get(`/api/infra-manager/calls`, {
          params: {
            page: 1,
            pageSize: 10,
            InitiatorIdOrClientIdOrOwnerId: props.userId,
          }
        });
        lastCalls.value = callsResponse.data.entities;
    } catch (error) {
        console.debug('Ошибка при загрузке информации о заявке: ', error);
    }

}

// Отслеживаем изменение userId и перезапрашиваем заявки
watch(() => props.userId, async (newUserId) => {
    if (newUserId) {
        await fetchUserCalls();
    }
}, { immediate: true })

// Открыть модальное окно с информацией по заявке
const openCallDetails = async (callId) => {
  isDialogVisible.value = true;
  errorOccurred.value = false;
  try {
    const response = await axiosInstance.get(`/api/infra-manager/calls/${callId}`);
    const callData = response.data;

    timelineEvents.value = [
      { date: callData.utcDateRegistered, label: 'Регистраиця' },
      { date: callData.utcDateOpened, label: 'Открытие' },
      { date: callData.utcDateAccomplished, label: 'Выполнение' },
      { date: callData.utcDateClosed, label: 'Закрытие' },
    ].filter(event => event.date);

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

    await fetchDocuments(callId); // Загружаем документы для выбранной заявки

  } catch (error) {
    console.debug('Ошибка при загрузке информации о заявке:', error);
    errorOccurred.value = true;
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

defineExpose({ openCallDetails });
</script>

<style scoped>
.service-card .call-card {
    padding: 20px;
    margin-bottom: 15px;
    border-radius: 10px;
    background-color: var(--p-grey-7);
    transition: all 0.5s;
    cursor: pointer;
}
.service-card {
    transition: all 0.5s;
    width: 100%;
}
.service-card 
.slide-fade-enter-active, .slide-fade-leave-active {
    transition: all 0.5s;
}
.slide-fade-enter-from, .slide-fade-leave-to {
    transform: translateY(20px);
    opacity: 0;
}
.dialog-title {
  text-align: center;
  margin-bottom: 20px;
}
.call-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.details-section {
  padding: 20px;
  border-radius: 10px;
  background-color: var(--p-grey-7);
  color: var(--p-text-color);

  .pi {
    margin-right: 10px;
    color: var(--primary-color);
    font-size: 1.4rem;
  }
}
.details-section h4 {
  margin-top: 0;
}
.details-section p {
  margin: 5px 0;
}

h2 {
    margin-bottom: 5px;
    font-weight: bold;
}
.error-message {
  color: var(--error-color, #f44336); /* Цвет ошибки */
  text-align: center;
  padding: 20px;
}
.document-card {
  padding: 16px;
  border-radius: 10px;
  background-color: var(--p-grey-7);
  margin-bottom: 10px;
}
.document-card h5 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--p-text-color);
}
.document-card p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--p-text-color);
}
</style>