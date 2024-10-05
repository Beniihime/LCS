<template>
    <div class="d-flex justify-content-center">
        <Button label="Поиск пользователей" class="button" @click="showSearchInfraUser = true"/>

        <Dialog v-model:visible="showSearchInfraUser" modal header="Найти пользователя InfraManager" :style="{ 'max-width': '110rem', 'min-width': '35rem' }">
            <div class="row mb-4">
                <div class="col">
                    <h5>Пользователь InfraManager</h5>
                    <AutoComplete 
                        v-model="selectedInfraUser" 
                        optionLabel="fullName" 
                        :suggestions="filteredInfraUsers" 
                        @complete="searchInfraUsers" 
                        field="fullName" 
                        placeholder="Выберите пользователя..."
                        @item-select="onInfraUserSelect"
                        @clear="clearInfraUserSelection"
                    />
                </div>
            </div>
            <Divider v-if="selectedInfraUserDetails" class="my-4"/>
            <div v-if="selectedInfraUserDetails" class="row mt-4">
                <div class="col">
                    <h4 class="mb-3"><strong>Информация о пользователе</strong></h4>
                    <p>ФИО: {{ selectedInfraUserDetails.fullName }}</p>
                    <p>Email: {{ selectedInfraUserDetails.email }}</p>
                    <p>Должность: {{ selectedInfraUserDetails.positionName }}</p>
                    <p v-if="selectedInfraUserLocation">Местоположение: {{ selectedInfraUserLocation.roomName }}</p>
                </div>
            </div>
            <Divider v-if="selectedInfraUserDetails" class="my-4"/>
            <div v-if="selectedInfraUserDetails" class="row my-4">
                <div class="col">
                    <h4 class="mb-3"><strong>Доступные сервисы</strong></h4>
                    <Tree 
                        :value="servicesTree" 
                        :expanded-keys="expandedKeys" 
                        @node-expand="onNodeExpand" 
                        @node-collapse="onNodeCollapse"
                        loadingMode="icon"
                    />
                </div>
            </div>
            <Divider v-if="selectedInfraUserDetails" class="my-4"/>
            <div v-if="lastCalls.length" class="row my-4">
                <div class="col">
                    <h4 class="mb-3"><strong>Последние 10 заявок</strong></h4>
                    <div class="card-grid">
                        <Card v-for="call in lastCalls" :key="call.id" class="call-card">
                            <template #title>
                                <span class="title">Заявка №{{ call.number }}</span>
                            </template>
                            <template #content>
                                <p><strong>Краткое описание:</strong> {{ call.callSummaryName }}</p>
                                <p><strong>Описание:</strong> {{ call.description }}</p>
                                <p><strong>Сервис:</strong>{{ call.serviceItemAttendanceFullName }}</p>
                            </template>
                        </Card>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios.js';

import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Button from 'primevue/button';
import AutoComplete from 'primevue/autocomplete';
import Card from 'primevue/card';
import Tree from 'primevue/tree';

const showSearchInfraUser = ref(false);

// Данные для пользователей InfraManager
const selectedInfraUser = ref(null);
const filteredInfraUsers = ref([]);

// Дополонительеные данные о пользователе InfraManager
const selectedInfraUserDetails = ref(null);
const selectedInfraUserLocation = ref(null);
const servicesTree = ref([]); // Данные для дерева сервисов

// Раскрытые узлы дерева
const expandedKeys = ref({});

// Последние 10 заявок
const lastCalls = ref([]);

// Функция для поиска пользователей InfraManager
const searchInfraUsers = async (event) => {
    const query = event.query;

    try {
        const response = await axiosInstance.get('/api/infra-manager/users', {
            params: {
                patternSearch: query
            }
        });
        filteredInfraUsers.value = response.data.map(user => ({
            fullName: user.fullName,
            id: user.id,
            details: user.details
        }));
    } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
    }
};

// Функция, вызываемая при выборе пользователя InfraManager
const onInfraUserSelect = async (event) => {
    const user = event.value;
    try {
        // Запрос основной информации о пользователе
        const userDetailsResponse = await axiosInstance.get(`/api/infra-manager/users/${user.id}`);
        selectedInfraUserDetails.value = userDetailsResponse.data;

        // Запрос информации о местоположении пользователя
        const userLocationResponse = await axiosInstance.get(`/api/infra-manager/users/${user.id}/client/info`);
        selectedInfraUserLocation.value = userLocationResponse.data;

        // Запрос последних 10 заявок
        const lastCallsResponse = await axiosInstance.get(`/api/infra-manager/users/${user.id}/calls`);
        lastCalls.value = lastCallsResponse.data.slice(0, 10); // Ограничиваем последние 10 заявок

        // Запрос доступных сервисов
        const servicesResponse = await axiosInstance.get(`/api/infra-manager/users/${user.id}/calls/services/available`);
        servicesTree.value = transformServicesToTree(servicesResponse.data); // Преобразуем в формат дерева
    } catch (error) {
        console.error('Ошибка при загрузке информации о пользователе InfraManager:', error);
    }
}

// Преобразование данных сервисов в формат дерева
const transformServicesToTree = (services) => {
    return services.map(category => ({
        key: `category-${category.id}`,
        label: category.name,
        children: category.services.map(service => ({
            key: `service-${service.id}`,
            label: service.name,
            children: service.items.map(item => ({
                key: `item-${item.id}`,
                label: item.name
            }))
        }))
    }));
};

// Функция для обработки раскрытия узла
const onNodeExpand = (event) => {
    expandedKeys.value = { ...expandedKeys.value, [event.node.key]: true };
}

// Фукнция для обработки сворачивания узла
const onNodeCollapse = (event) => {
    const newExpandedKeys = { ...expandedKeys.value };
    delete newExpandedKeys[event.node.key];
    expandedKeys.value = newExpandedKeys;
}

// Функция, вызываемая при очистке поля AutoComplete
const clearInfraUserSelection = () => {
    selectedInfraUserDetails.value = null;
    selectedInfraUserLocation.value = null;
    lastCalls.value = [];
    servicesTree.value = [];
    expandedKeys.value = {};
};
</script>

<style scoped>
.button {
    width: 100%;
    border-radius: 12px;
    color: white;
    font-size: 1.2rem;
}
p {
    margin-bottom: 5px;
    font-size: 1.1rem;
}
.card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
}
.call-card {
    padding: 1rem;
    border: 1px solid var(--p-grey-3);
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.title {
    font-size: 2rem;
}
</style>