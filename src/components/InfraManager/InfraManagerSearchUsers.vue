<template>
    <div class="d-flex justify-content-center">

        <Dialog v-model:visible="showSearchInfraUser" modal header="Поиск пользователей" :style="{ 'max-width': '110rem', 'min-width': '35rem' }">
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
                    >
                        <template #default="{ node }">
                            <span>{{ node.label }}</span>
                            <Tag 
                                v-if="node.isAvailable !== undefined"
                                :severity="node.isAvailable ? 'success' : 'danger'"
                                :icon="node.isAvailable ? 'pi pi-check' : 'pi pi-times'"
                                class="ms-2"
                            />
                        </template>
                    </Tree>
                </div>
            </div>
            <Divider v-if="selectedInfraUserDetails" class="my-4"/>
            <div class="row my-4">
                <div class="col">
                    <InfraManagerCalls v-if="selectedInfraUserDetails" :userId="selectedInfraUser.id" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import axiosInstance from '@/utils/axios.js';

import InfraManagerCalls from '@/components/InfraManager/InfraManagerCalls.vue';

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
        console.debug('Ошибка при загрузке пользователей:', error);
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
        const lastCallsResponse = await axiosInstance.get(`/api/infra-manager/calls`, {
            params: {
                page: 1,
                pageSize: 10,
                InitiatorIdOrClientIdOrOwnerId: user.id,
            }
        });
        lastCalls.value = lastCallsResponse.data;

        // Запрос доступных сервисов
        const servicesResponse = await axiosInstance.get(`/api/infra-manager/users/${user.id}/calls/services/available`);
        servicesTree.value = transformServicesToTree(servicesResponse.data); // Преобразуем в формат дерева
    } catch (error) {
        console.debug('Ошибка при загрузке информации о пользователе InfraManager:', error);
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
            isAvailable: service.isAvailable,
            children: service.items.map(item => ({
                key: `item-${item.id}`,
                label: item.name,
                isAvailable: item.isAvailable
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

// Добавляем метод для управления состоянием из родителя
const openDialogSearch = () => {
    showSearchInfraUser.value = true;
};

defineExpose({ openDialogSearch });
</script>

<style scoped>
p {
    margin-bottom: 5px;
    font-size: 1.1rem;
}
</style>